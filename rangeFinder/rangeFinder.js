let playerX = 0
let playerY = 0
let range = 15


function coordinateDistanceToPlayer (x, y) {
  return Math.sqrt(Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2))
}

function posToMap (h) {
  let offset = 21.5
  let pitch = 0.02
  return h * pitch + offset
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
      div.textContent = `${partyMember['Name']} - ${distance.toFixed(1)}y`
      div.style.color = 'red'
      if (distance < range) div.style.color = 'green'
      mainDiv.appendChild(div)
    }
    partyDiv.innerHTML = ''
    partyDiv.appendChild(mainDiv)
  })
}

function getPartyMembersFromCombatants (event) {
  return event.filter(e => e['PartyType'] === 1)
}

function updateRange (slider) {
  try {
    range = slider.target.value
  } catch (e) { }
  document.querySelector('.rangeText').textContent = `Range: ${range}`
}

window.addEventListener('DOMContentLoaded', async (_) => {
  const partyDiv = document.querySelector('.party')
  const rangeSlider = document.querySelector('#range')
  addOverlayListener("onPlayerChangedEvent", (e) => {
    playerX = e['detail']['pos']['x']
    playerY = e['detail']['pos']['y']
  });
  rangeSlider.addEventListener('change', updateRange)
  updateRange(rangeSlider)
  setInterval(combatantTimer, 100, partyDiv)
  startOverlayEvents()
})
