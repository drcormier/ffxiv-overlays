let draw = false
let currentZone = ''
let currentZonePoints = []
let xCoord = 0.0
let yCoord = 0.0
let zCoord = 0.0
let rotation = 0.0

function debug () {
  let element = document.getElementById('debug')
  //element.innerText = `mana_values: ${mana_values}\ntime_values: ${time_values}\nlast_mana: ${last_mana}`;
  element.innerText = build_points().toString()
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

function currentLocationPoints () {
  let payload = {
    location: currentZone,
  }
  let url = 'http://127.0.0.1:5000/locations'
  return sendRequest(url, payload)
}

function posToMap (h) {
  let offset = 21.5
  let pitch = 0.02
  return h * pitch + offset
}

function build_points () {
  return {
    datasets: [
      {
        label: 'Aether Currents',
        data: currentZonePoints,
        pointBorderColor: 'blue',
      }, {
        label: 'Current Location',
        data: [
          {
            'x': xCoord,
            'y': yCoord,
          }],
        pointBorderColor: 'red',
      }],
  }
}

function render_chart () {
  let ctx = document.getElementById('myChart')
  let myChart = new Chart(ctx, {
    type: 'scatter',
    data: build_points(),
    options: {
      animation: {
        duration: 0,
      },
      legend: {
        display: false,
      },
      scales: {
        yAxes: [
          {
            ticks: {
              display: false,
              beginAtZero: true,
              reverse: true,
              start: 0,
              max: 42,
            },
            gridLines: {
              drawOnChartArea: false,
            },
          }],
        xAxes: [
          {
            ticks: {
              display: false,
              beginAtZero: true,
              start: 0,
              max: 42,
            },
            gridLines: {
              drawOnChartArea: false,
            },
          }],
      },
    },
  })
}

function sendAttune () {
  let url = 'http://127.0.0.1:5000/nearest'
  let payload = {
    location: currentZone,
    x: xCoord,
    y: yCoord,
    attune: true,
  }
  sendRequest(url, payload)
  let data = currentLocationPoints()
  currentZonePoints = data['currents']

}

function checkForAttune (e) {
  if (e['line'][0] == '00' && e['line']['4'] ==
    'Attuning with the aether current allows you to better understand the area\'s movement of the winds!') {
    sendAttune()
  }
}

function log_location (e) {
  xCoord = posToMap(e['detail']['pos']['x'])
  yCoord = posToMap(e['detail']['pos']['y'])
  zCoord = e['detail']['pos']['z'] * 0.02
  rotation = e['detail']['rotation']
}

function changeZone (e) {
  currentZone = e['zoneName']
  let data = currentLocationPoints()
  currentZonePoints = data['currents']
  /*
  payload = {
    location: currentZone,
  }
  document.querySelector(
    'canvas').style.background = `url(http://127.0.0.1:5000/map${formatParams(
    payload)})`
  document.querySelector('canvas').style.backgroundSize = 'contain'

   */
}

function findNearestCurrent () {
  let bestDistance = Infinity
  let bestX = 0
  let bestY = 0
  let bestZ = 0
  for (const idx in currentZonePoints) {
    const point = currentZonePoints[idx]
    const x = point['x']
    const y = point['y']
    const z = point['z']
    const distance = Math.sqrt(
      Math.pow(xCoord - x, 2) + Math.pow(yCoord - y, 2))
    if (distance < bestDistance){
      bestDistance = distance
      bestX = x
      bestY = y
      bestZ = z
    }
  }
  let deltaX = bestX - xCoord
  let deltaY = bestY - yCoord
  let deltaZ = bestZ - zCoord
  let deltaTheta = Math.atan2(deltaY, deltaX)
  deltaTheta -= Math.PI - rotation;
  let angle = deltaTheta * 180 / Math.PI;
  let arrow = document.querySelector('.radar-image-div');
  arrow.style.transform = 'rotate(' + angle + 'deg)';
  let nearest = document.querySelector('#nearest')
  nearest.innerHTML = `Nearest current: X${deltaX.toFixed(2)} Y${deltaY.toFixed(2)} Z${deltaZ.toFixed(2)}<br>Distance ${(bestDistance/0.02).toFixed(4)}<br>Remaining Currents: ${currentZonePoints.length}<br>`
}

window.addEventListener('DOMContentLoaded', async (e) => {
  addOverlayListener('onPlayerChangedEvent', (e) => {
    log_location(e)
    //render_chart()
    findNearestCurrent()
  })

  addOverlayListener('ChangeZone', (e) => {
    changeZone(e)
  })

  addOverlayListener('LogLine', (e) => {
    checkForAttune(e)
  })

  startOverlayEvents()

  console.log('aether current map loaded')

})
