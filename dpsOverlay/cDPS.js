'use strict'

import { initCharts } from './charts.js'
import { initOptions, toggleOptions } from './options.js'
import { parseSPS } from './sps.js'
import { turnPlayerColorPurple } from './button.js'
import { hideOptions } from './options.js'

window.addEventListener('DOMContentLoaded', async (_) => {
  const divGraph = document.querySelector('.graph')
  const divTitle = document.querySelector('.title')
  const divDPSChart = document.querySelector('#dpsChart')
  const divHPSChart = document.querySelector('#hpsChart')
  addOverlayListener('CombatData', (e) => {
    parseSPS(e, divGraph, divTitle)
  })
  document.querySelector('.buttonOptions').addEventListener('click', toggleOptions)
  document.querySelector('.buttonPCPurple').addEventListener('click', turnPlayerColorPurple)
  document.querySelector('.buttonHideOptions').addEventListener('click', hideOptions)

  initOptions()

  //initCharts(divDPSChart, divHPSChart)

  startOverlayEvents()
  console.log('cDPS loaded')
})
