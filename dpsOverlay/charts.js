'use strict'

let dpsChart
let hpsChart

const chartOptions = {
  animation: {
    duration: 0, // general animation time
  },
  hover: {
    animationDuration: 0, // duration of animations when hovering an item
  },
  responsiveAnimationDuration: 0, // animation duration after a resize
  legend: {
    display: false,
  },
  scales: {
    yAxes: [
      {
        ticks: {
          display: false,
        },
        scaleLabel: {
          display: false,
        },
      },
    ],
    xAxes: [
      {
        ticks: {
          min: 0,
        },
      },
    ],
  },
}

function initCharts (divDPSChart, divHPSChart) {
  dpsChart = new Chart(divDPSChart, {
    type: 'horizontalBar',
    data: [],
    options: chartOptions,
  })
  hpsChart = new Chart(divHPSChart, {
    type: 'horizontalBar',
    data: [],
    options: chartOptions,
  })
}

function updateChart (chart, spsList) {
  chart.data = {
    labels: spsList.map(sps => sps.playerName),
    datasets: [
      {
        backgroundColor: spsList.map(sps => sps.color),
        data: spsList.map(sps => sps.encsps),
      },
    ],
  }

  chart.update()
}

export { dpsChart, hpsChart, initCharts, updateChart }
