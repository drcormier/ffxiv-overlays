'use strict'

let debug = false
let updateJobDataOutOfCombat = true
let updatePlayerDataOutOfCombat = true
let updateBarOutOfCombat = true
let playerID = 0
let gcd = 250
let currentGCDTime = 0
let currentCastTime = 0
let playerName = ''
let gcdTimer = null
let castTimer = null
const hpFormat = '0.0a'

const playerStatsRE = /\[.*] 0C:Player Stats:.*:(\d+):(\d+):0:.*/
const updatePlayerNameRE = /\[.+?] 02:Changed primary player to (.+)\./


function updateTime (data) {
  if (debug) document.querySelector('#debug').innerText = Date.now() + data
}

function linearRegression (y, x) {
  let lr = {}
  let n = y.length
  let sum_x = 0
  let sum_y = 0
  let sum_xy = 0
  let sum_xx = 0
  let sum_yy = 0

  for (let i = 0; i < y.length; i++) {

    sum_x += x[i]
    sum_y += y[i]
    sum_xy += (x[i] * y[i])
    sum_xx += (x[i] * x[i])
    sum_yy += (y[i] * y[i])
  }

  lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x)
  lr['intercept'] = (sum_y - lr.slope * sum_x) / n
  lr['r2'] = Math.pow((n * sum_xy - sum_x * sum_y) /
    Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)), 2)

  return lr
}

function msToMMSS (millis, casual = true, showMillis = false) {
  let seconds = Math.floor(millis / 1000)
  let remainingMilliseconds = Math.floor(millis % 1000)
  let minutes = Math.floor(seconds / 60)
  let remainingSeconds = Math.floor(seconds % 60)
  if (casual) return (minutes < 10 ? '0' + minutes : minutes) + 'm ' +
    (remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds) + 's' +
    (showMillis ? ' ' + remainingMilliseconds + 'ms' : '')
  else return (minutes < 10 ? '0' + minutes : minutes) + ':' +
    (remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds) +
    (showMillis ? '.' + remainingMilliseconds + ' ms' : '')
}

let inCombat = false
let times = []
let manas = []
let previousMP = 10000
const maxPoints = 8
let tto = 0

function timeTillEmpty (times, dataPoints) {
  // let the first point be 0 seconds, and every point after that is positive time-wise
  let newTimes = times.map(x => (x - times[0]))
  let lr = linearRegression(dataPoints, newTimes)
  return -lr.intercept / lr.slope
}

function ParseAbilitySpellSpeed (e) {
  if (e['detail']['logs']) {
    let logs = e['detail']['logs']
    for (const logLine in logs) {
      if (logs.hasOwnProperty(logLine)) {
        let match = playerStatsRE.exec(logs[logLine])
        if (match) {
          const skillSpeed = parseInt(match[1])
          const spellSpeed = parseInt(match[2])
          const speed = Math.max(skillSpeed, spellSpeed)
          const statBase = 380
          const levelMod = 3300
          const delta = speed - statBase
          gcd = Math.floor(Math.floor(100 * 100 * (Math.floor(
            2500 * (1000 - Math.floor(130 * delta / levelMod)) / 1000) / 1000)) /
            100)
          //document.querySelector('.gcd').textContent = gcd.toString()
          continue
        }
        match = updatePlayerNameRE.exec(logs[logLine])
        if (match) {
          playerName = match[1]
          //document.querySelector('.gcd').textContent = playerName
        }
      }
    }
  }
}

function UpdatePlayerData (e) {
  if (e) {
    updateTime('player data ' + inCombat)
    if (inCombat || updatePlayerDataOutOfCombat) {
      let mp = e.detail['currentMP']
      // determine time until we run out of mana
      // we keep track of the previous mp value and the new value and only update if they are different
      // this is because every tick spent moving triggers a player data update, as player position is
      // one of the things provided
      if (mp !== previousMP) {
        previousMP = mp
        manas.push(mp)
        times.push(Date.now())
        // reduce points if fight has gone on too long
        if (manas.length > maxPoints) manas = manas.slice(1)
        if (times.length > maxPoints) times = times.slice(1)
        tto = timeTillEmpty(times, manas)
        if (Number.isNaN(tto) && times.length > 1) {
          times = []
          manas = []
        }
      }
      let timeToOoM = tto - (Date.now() - times[0])
      document.querySelector('#encounter').innerText = 'Time till OoM: ' +
        (timeToOoM > 0 ? msToMMSS(timeToOoM, true, true) : 'Never')

    } else {
      times = []
      manas = []
      document.querySelector('#encounter').innerText = ''
    }

  }
}

function updateJobData (e) {
  if (inCombat || updateJobDataOutOfCombat) {
    switch (e['detail']['job']) {
      case 'WHM':
        if (e['detail']['jobDetail']['lilyMilliseconds']) {
          let timeTillLily = (30000 -
            e['detail']['jobDetail']['lilyMilliseconds']) / 1000.0
          let timeTillLilyCap = 30 *
            (2 - e['detail']['jobDetail']['lilyStacks']) + timeTillLily
          document.querySelector('#job').innerText = 'Time till lily: ' +
            timeTillLily.toFixed(2) + 's\nTime till lily cap: ' +
            timeTillLilyCap.toFixed(2) + 's'
        }
        break
      case 'AST':
        let text = ''
        if (e['detail']['jobDetail']['heldCard']) {
          let card = e['detail']['jobDetail']['heldCard']
          // determine ideal target for currently drawn card
          if (['Balance', 'Arrow', 'Spear'].includes(card)) {
            text += 'Card: Melee/Tank'
          } else if (['Bole', 'Ewer', 'Spire'].includes(card)) {
            text += 'Card: Ranged/Healer'
          } else {
            text += 'Card: None drawn'
          }
          if (e['detail']['jobDetail']['arcanums']) {
            const currentArcanums = e['detail']['jobDetail']['arcanums'].split(
              ', ')
            const arcanums = {
              'Lunar': ['Ewer', 'Arrow'],
              'Celestial': ['Spear', 'Spire'],
              'Solar': ['Bole', 'Balance'],
            }
            // determine if the currently drawn card should be played or not
            // in order to generate a unique arcanum for divination
            let play = true
            for (const arcanum in arcanums) {
              const cards = arcanums[arcanum]
              if (cards.includes(card) && currentArcanums.includes(arcanum)) {
                play = false
              }
            }
            if (play) {
              text += '\nPlay Card'
            } else {
              text += '\nDO NOT Play Card'
            }
            let uniqueArcanums = new Set(currentArcanums).size
            if (currentArcanums == 'None') {
              text += '\nDivination: unplayable'
            } else {
              text += `\nDivination: ${3 + uniqueArcanums}%${uniqueArcanums ===
              3 ? ' (max)' : ''}`
            }
          }
        }
        document.querySelector('#job').textContent = text
        break
    }
  }
}

function UpdateInCombat (e) {
  if (e) {
    updateTime('combat')
    inCombat = e.detail['inGameCombat']
  }
}

function getColor (value) {
  //value from 0 to 100
  const hue = ((value / 100.0) * 120).toString(10)
  return ['hsl(', hue, ',100%,50%)'].join('')
}

let currentHP = 0
let currentShield = 0

function barInAndOutOfCombat (div) {
  div.style.display = 'block'
  div.style.opacity = '1'
  if (!inCombat) {
    if (!updateBarOutOfCombat) {
      div.style.display = 'none'
    }
    div.style.opacity = '0.5'
  }
}

function UpdateHPBar (e, barOuter, barHP, barShield, divValue) {
  let effectiveHP = e['detail']['maxHP'] + e['detail']['currentShield']
  let percentHP = e['detail']['currentHP'] * 100 / effectiveHP
  let percentShield = e['detail']['currentShield'] * 100 / effectiveHP
  if (currentShield !== percentShield || currentHP !== percentHP) {
    barHP.style.width = percentHP + '%'
    barShield.style.width = (percentHP + percentShield) + '%'
    divValue.textContent = numeral(e['detail']['currentHP']).format(hpFormat) +
      (e['detail']['currentShield'] > 0 ? ' (' +
        e['detail']['currentShield'].toLocaleString() + ')' : '')
    currentHP = percentHP
    currentShield = percentShield
  }
  barInAndOutOfCombat(barOuter)
  barInAndOutOfCombat(barHP)
  barInAndOutOfCombat(barShield)
  barInAndOutOfCombat(divValue)
}

let currentMP = 0

function UpdateMPBar (e, barOuter, barInner, divComplete) {
  let maxMP = e['detail']['maxMP']
  let currentMPValue = e['detail']['currentMP']
  let percentMP = currentMPValue * 100 / maxMP
  if (currentMP !== percentMP) {
    barInner.style.width = percentMP + '%'
    divComplete.textContent = e['detail']['currentMP'].toLocaleString()
    currentMP = percentMP
  }
  barInAndOutOfCombat(barOuter)
  barInAndOutOfCombat(barInner)
  barInAndOutOfCombat(divComplete)
}

let currentFocusTargetHP = 0

function updateFocusTargetHPBar (e, barOuter, barHP, barShield, divValue) {
  if (e['Focus']) {
    let maxHP = e['Focus']['MaxHP']
    let percentShield = e['Focus']['PercentShields']
    let currentShield = Math.round(percentShield * maxHP / 100)
    let effectiveMaxHP = maxHP + currentShield
    let currentHP = e['Focus']['CurrentHP']
    let percentHP = currentHP * 100 / effectiveMaxHP
    percentShield = currentShield * 100 / effectiveMaxHP
    if (currentFocusTargetHP !== percentHP) {
      barHP.style.width = percentHP + '%'
      barShield.style.width = (percentHP + percentShield) + '%'
      divValue.textContent = numeral(currentHP).format(hpFormat) +
        (percentShield > 0 ? ` (${currentShield.toLocaleString()})` : '')
      currentFocusTargetHP = percentHP
    }
    barInAndOutOfCombat(barOuter)
    barInAndOutOfCombat(barHP)
    barInAndOutOfCombat(barShield)
    barInAndOutOfCombat(divValue)
  } else {
    barOuter.style.display = 'none'
    barHP.style.display = 'none'
    barShield.style.display = 'none'
    divValue.style.display = 'none'
  }
}

function dumpDebugData (e) {
  updateTime(JSON.stringify(e, null, 4))
}

function castBar (json, barOuter, barInner, barComplete, spellText) {
  if (json['type'] === 'init') {
    let castTime = json['current']
    let spellTime = json['time']
    let ratioComplete = castTime / spellTime
    barOuter.style.display = 'block'
    barInner.style.display = 'block'
    barComplete.style.display = 'block'
    spellText.style.display = 'block'
    clearInterval(castTimer)
    clearInterval(gcdTimer)
    castTimer = setInterval(updateCastBar, 10, barOuter, barInner, barComplete,
      spellTime)
    spellText.textContent = json['name']
    barInAndOutOfCombat(barOuter)
    barInAndOutOfCombat(barInner)
    barInAndOutOfCombat(barComplete)
    barInAndOutOfCombat(spellText)
  } else {
    barOuter.style.display = 'none'
    barInner.style.display = 'none'
    barComplete.style.display = 'none'
    spellText.style.display = 'none'
    clearInterval(castTimer)
    currentCastTime = 0
  }
}

function updateCastBar (
  divCastOuter, divCastInner, divCastComplete, spellTime) {
  currentCastTime += 1
  let percentComplete = currentCastTime * 100.0 / spellTime
  divCastInner.style.width = percentComplete + '%'
  divCastComplete.textContent = ((spellTime - currentCastTime) / 100.0).toFixed(2)
  if (currentCastTime >= spellTime){
    clearInterval(spellTime)
  }
}

function updateGCDBar (divGCDOuter, divGCDInner) {
  currentGCDTime += 1
  divGCDOuter.style.display = 'block'
  divGCDInner.style.display = 'block'
  if (currentGCDTime >= gcd) {
    divGCDOuter.style.display = 'none'
    divGCDInner.style.display = 'none'
    currentGCDTime = 0
    clearInterval(gcdTimer)
  } else {
    let percentComplete = (gcd - currentGCDTime) * 100.0 / gcd
    divGCDInner.style.width = percentComplete + '%'
  }
}

function updateTargetBar (e, barOuter, barHP, divValue) {
  if (e['Target'] && e['Target']['MaxHP'] !== 0) {
    let color = 'Chartreuse'
    if (e['Target']['Type'] === 2) {
      // enemy target
      color = 'red'
    } else if (e['Target']['Type'] === 1) {
      // player target
      color = 'BlueViolet'
    }
    let percentHP = e['Target']['CurrentHP'] * 100 / e['Target']['MaxHP']
    barHP.style.width = percentHP + '%'
    barHP.style.backgroundColor = color
    divValue.textContent = numeral(e['Target']['CurrentHP']).format(hpFormat)
    barInAndOutOfCombat(barOuter)
    barInAndOutOfCombat(barHP)
    barInAndOutOfCombat(divValue)
  } else {
    barOuter.style.display = 'none'
    barHP.style.display = 'none'
    divValue.style.display = 'none'
  }
}

function webSocketConnection (divOuter, divInner, barComplete, divSpell) {
  let reconnected = false
  let socket = new WebSocket('ws://localhost:6789')
  socket.onmessage = function (event) {
    let json = JSON.parse(event.data)
    castBar(json, divOuter, divInner, barComplete, divSpell)
  }
  socket.onclose = function (event) {
    console.log('Websocket connection closed')
    if (!reconnected) setTimeout(webSocketConnection, 60000, divOuter, divInner,
      barComplete, divSpell)
    reconnected = true
  }
  socket.onerror = function (error) {
    console.log(`Websocket error: ${error.message}`)
    if (!reconnected) setTimeout(webSocketConnection, 60000, divOuter, divInner,
      barComplete, divSpell)
    reconnected = true
  }

}

window.addEventListener('DOMContentLoaded', async (_) => {
  // self hp
  let barSelfOuterHP = document.querySelector('.barOuter.hp.self')
  let barSelfInnerHP = document.querySelector('.barInner.hp.self')
  let barSelfShield = document.querySelector('.barInner.shield.self')
  let barSelfCompleteHP = document.querySelector('.barComplete.hp.self')
  // self mp
  let barOuterMP = document.querySelector('.barOuter.mp.self')
  let barInnerMP = document.querySelector('.barInner.mp.self')
  let barCompleteMP = document.querySelector('.barComplete.mp')
  // target hp
  let divTarget = document.querySelector('.target')
  let barTargetOuterHP = document.querySelector('.barOuter.hp.target')
  let barTargetInnerHP = document.querySelector('.barInner.hp.target')
  let barTargetCompleteHP = document.querySelector('.barComplete.hp.target')
  // focus target hp
  let barFocusOuterHP = document.querySelector('.barOuter.hp.focus')
  let barFocusInnerHP = document.querySelector('.barInner.hp.focus')
  let barFocusShield = document.querySelector('.barInner.shield.focus')
  let barFocusCompleteHP = document.querySelector('.barComplete.hp.focus')
  // spell cast
  let divSpell = document.querySelector('.spell')
  let barOuterCast = document.querySelector('.barOuter.cast')
  let barInnerCast = document.querySelector('.barInner.cast')
  let barCompleteCast = document.querySelector('.barComplete.cast')
  // gcd bar
  //let barOuterGCD = document.querySelector('.barOuter.gcd')
  //let barInnerGCD = document.querySelector('.barInner.gcd')
  addOverlayListener('onPlayerChangedEvent', (e) => {
    //UpdatePlayerData(e)
    UpdateHPBar(e, barSelfOuterHP, barSelfInnerHP, barSelfShield,
      barSelfCompleteHP)
    UpdateMPBar(e, barOuterMP, barInnerMP, barCompleteMP)
    //updateJobData(e)
    dumpDebugData(e)
    playerID = e['detail']['id']
  })
  addOverlayListener('onInCombatChangedEvent', (e) => {
    UpdateInCombat(e)
  })
  addOverlayListener('EnmityTargetData', (e) => {
    updateFocusTargetHPBar(e, barFocusOuterHP, barFocusInnerHP, barFocusShield,
      barFocusCompleteHP)
    updateTargetBar(e, barTargetOuterHP, barTargetInnerHP, barTargetCompleteHP)
  })
  /*
  addOverlayListener('onLogEvent', (e) => {
    ParseAbilitySpellSpeed(e)
  })

   */

  webSocketConnection(barOuterCast, barInnerCast, barCompleteCast, divSpell)

  startOverlayEvents()

  console.log('cOverlay loaded')

})
