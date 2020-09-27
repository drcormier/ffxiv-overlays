let playerX = 0
let playerY = 0
let rangeInner = 15
let rangeOuter = 30

let partyILVLS = {}

function partyILVL (event) {
  for (const partyMember of event['party']) {
    let name = partyMember['name']
    partyILVLS[name] = sendRequest('localhost:6969', { 'name': name })['ilvl']
  }
}

function formatParams (params) {
  return '?' + Object.keys(params).map(function (key) {
    return key + '=' + encodeURIComponent(params[key])
  }).join('&')
}

function sendRequest (url, payload) {
  let xmlhttp = new XMLHttpRequest()
  let data = {}
  xmlhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      data = JSON.parse(this.responseText)
    }
  }
  xmlhttp.open('GET', url + formatParams(payload), false)
  xmlhttp.send()
  return data
}

function coordinateDistanceToPlayer (x, y) {
  return Math.sqrt(Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2))
}

function comparePlayers (player1, player2) {
  return coordinateDistanceToPlayer(player1['PosX'], player1['PosY']) -
    coordinateDistanceToPlayer(player2['PosX'], player2['PosY'])
}

function combatantTimer (partyDiv) {
  let mainDiv = document.createElement('div')
  callOverlayHandler({ call: 'getCombatants' }).then(e => {
    let party = getPartyMembersFromCombatants(e['combatants'])
    party.sort(comparePlayers)
    party.shift()
    for (const partyMember of party) {
      const partyMemberX = partyMember['PosX']
      const partyMemberY = partyMember['PosY']
      const distance = coordinateDistanceToPlayer(partyMemberX, partyMemberY)
      let div = document.createElement('div')
      div.textContent = `[${partyILVLS[partyMember['Name']]}] ${partyMember['Name']} - ${distance.toFixed(
        1)}y`
      div.style.color = 'red'
      if (distance <= rangeOuter) div.style.color = 'yellow'
      if (distance <= rangeInner) div.style.color = 'green'
      mainDiv.appendChild(div)
    }
    partyDiv.innerHTML = ''
    partyDiv.appendChild(mainDiv)
  })
}

function getPartyMembersFromCombatants (event) {
  return event.filter(e => e['PartyType'] === 1)
}

function updateRangeInner (slider) {
  try {
    rangeInner = slider.target.value
  } catch (e) { }
  document.querySelector('.rangeInnerText').textContent = `Range: ${rangeInner}`
}

function updateRangeOuter (slider) {
  try {
    rangeOuter = slider.target.value
  } catch (e) { }
  document.querySelector('.rangeOuterText').textContent = `Range: ${rangeOuter}`
}

function hideSettings (...args) {
  for (const arg of args) {
    arg.style.display = 'none'
  }
}

function hideButton (event) {
  const rangeInnerSlider = document.querySelector('#rangeInner')
  const rangeOuterSlider = document.querySelector('#rangeOuter')
  const rangeInnerText = document.querySelector('.rangeInnerText')
  const rangeOuterText = document.querySelector('.rangeOuterText')
  const buttonHide = document.querySelector('.buttonHide')
  hideSettings(rangeInnerSlider, rangeOuterSlider, rangeInnerText,
    rangeOuterText, buttonHide)
}

window.addEventListener('DOMContentLoaded', async (_) => {
  const partyDiv = document.querySelector('.party')
  const rangeInnerSlider = document.querySelector('#rangeInner')
  const rangeOuterSlider = document.querySelector('#rangeOuter')
  const buttonHide = document.querySelector('.buttonHide')
  addOverlayListener('onPlayerChangedEvent', (e) => {
    playerX = e['detail']['pos']['x']
    playerY = e['detail']['pos']['y']
  })
  addOverlayListener('PartyChanged', partyILVL)
  rangeInnerSlider.addEventListener('change', updateRangeInner)
  updateRangeInner(rangeInnerSlider)
  rangeOuterSlider.addEventListener('change', updateRangeOuter)
  updateRangeOuter(rangeOuterSlider)
  buttonHide.addEventListener('click', hideButton)
  setInterval(combatantTimer, 100, partyDiv)
  startOverlayEvents()
})
