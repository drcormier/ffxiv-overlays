'use strict'

import { options } from './options.js'
import { DPS, HEALER, jobDictionary, percentFormat, TANK } from './constants.js'
import { dpsChart, hpsChart, updateChart } from './charts.js'

class CombatantSPS {
  constructor (playerName, playerClass, encsps, encspsPrintable) {
    this.playerName = playerName
    this.playerJob = playerClass
    this.encsps = encsps
    this.encspsPrintable = encspsPrintable
    if (options[document.querySelector('.buttonPCPurple').textContent] &&
      this.playerName === 'YOU') this.color = 'purple'
    else this.color = getColorFromJob(this.playerJob)
  }

  percentage = function (encspsTotal) {
    return this.encsps * 100.0 / encspsTotal
  }

  chartData = function () {
    return {
      data: [this.encsps],
      backgroundColor: this.color
    }
  }

}

function getColorFromJob (job) {
  let role = 'Unknown'
  try {
    role = jobDictionary[job.toUpperCase()]['role']
  } catch (e) {
    // role isn't in the dictionary
  }
  switch (role) {
    case HEALER:
      return 'green'
    case DPS:
      return 'red'
    case TANK:
      return 'blue'
    default:
      return 'grey'
  }

}

function sortSPS (a, b) {
  // sort in descending order
  return b.encsps - a.encsps
}

function barSPS (sps, spsTotal, largestSps) {
  // root div that contains everything for one combatant
  let row = document.createElement('div')
  row.className = 'row'
  // bar of max width that provides a black background
  let backgroundBar = document.createElement('div')
  backgroundBar.className = 'bar barInner'
  row.appendChild(backgroundBar)
  // bar representing the dps/hps done by the current combatant
  let spsBar = document.createElement('div')
  spsBar.className = 'bar barSps'
  // scale width based on percent contribution and normalize to largest percent
  spsBar.style.width = (sps.percentage(spsTotal) * 100.0 / largestSps).toFixed(
    2) + '%'
  spsBar.style.backgroundColor = sps.color
  row.appendChild(spsBar)
  // combatant's name
  let nameText = document.createElement('div')
  nameText.className = 'bar nameText'
  nameText.textContent = sps.playerName
  row.appendChild(nameText)
  // dps/hps text
  let spsText = document.createElement('div')
  spsText.className = 'bar dpsText'
  spsText.textContent = `${sps.encspsPrintable} (${numeral(
    sps.percentage(spsTotal)).format(percentFormat)}%)`
  row.appendChild(spsText)
  return row
}

function parseSPS (combatData, divGraph, divTitle) {
  const combatantArray = combatData['Combatant']
  const encounter = combatData['Encounter']
  let sumDPS = encounter['encdps']
  let sumHPS = encounter['enchps']
  divGraph.innerHTML = ''
  divTitle.textContent = `${encounter['CurrentZoneName']} - ${encounter['title']} - ${encounter['duration']}`
  let dpsList = []
  let hpsList = []
  for (const combatantArrayKey in combatantArray) {
    if (combatantArray.hasOwnProperty(combatantArrayKey)) {
      let combatant = combatantArray[combatantArrayKey]
      // hide combatants from the dps list if they've done zero dps
      if (combatant['ENCDPS'].localeCompare('0') !== 0) {
        dpsList.push(
          new CombatantSPS(combatant['name'], combatant['Job'],
            combatant['encdps'],
            combatant['encdps-*']))
      }
      // lookup may fail if the combatant does not have a job (i.e. chocobo)
      // so we just ignore them using a try catch
      try {
        // only show healers in hps list
        if (jobDictionary[combatant['Job'].toUpperCase()]['role'].localeCompare(
          HEALER) === 0) {
          hpsList.push(
            new CombatantSPS(combatant['name'], combatant['Job'],
              combatant['enchps'],
              combatant['enchps-*']))
        }
      } catch (e) { }
    }
  }
  if (dpsList.length > 0) {
    let divDPS = document.createElement('div')
    divDPS.className = 'dps'
    // header of dps table
    // shows encounter dps and total damage done
    divDPS.textContent = `DPS: ${encounter['encdps-*']} - Total: ${numeral(
      encounter['damage']).format('0,0')}`
    // combatants will be shown in descending dps order
    dpsList.sort(sortSPS)
    // we are going to scale the bar lengths by the largest dps
    // this means the highest dps combatant will take up 100% of the bar
    // even if their contribution percentage is less than that
    // this makes it easier to gauge contribution in raids especially
    let largestDPS = dpsList[0].percentage(sumDPS)
    //let spsList = []
    dpsList.forEach(function (dps) {
      //spsList.push(dps)
      divDPS.appendChild(barSPS(dps, sumDPS, largestDPS))
    })
    //updateChart(dpsChart, spsList)
    divGraph.appendChild(divDPS)
  }
  if (hpsList.length > 0) {
    let divHPS = document.createElement('div')
    divHPS.className = 'hps'
    // hps behaves basically identically to dps
    divHPS.textContent = `HPS: ${encounter['enchps-*']} - Total: ${numeral(
      encounter['healed']).format('0,0')}`
    hpsList.sort(sortSPS)
    let largestHPS = hpsList[0].percentage(sumHPS)
    //let spsList = []
    hpsList.forEach(function (hps) {
      //spsList.push(hps)
      divHPS.appendChild(barSPS(hps, sumHPS, largestHPS))
    })
    //updateChart(hpsChart, spsList)
    divGraph.appendChild(divHPS)
  }
}

export {parseSPS}
