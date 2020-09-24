let mana_values = []
let hp_values = []
let time_values = []
let last_mana = -1
let last_hp = -1
let draw = false
let inCombat = false
let maxHp = -1

function debug () {
  let element = document.getElementById('debug')
  //element.innerText = `mana_values: ${mana_values}\ntime_values: ${time_values}\nlast_mana: ${last_mana}`;
  element.innerText = build_points().toString()
}

function build_points () {
  let times = []
  for (let i = 0; i < mana_values.length; i++) {
    let scaled_time = (time_values[i] - (time_values[0])) / 1000.0
    times.push(scaled_time)
  }
  return {
    labels: times,
    datasets: [
      {
        label: 'Mana',
        data: mana_values,
        fill: false,
        borderColor: 'blue',
        yAxisID: 'mana',
      }, {
        label: 'HP',
        data: hp_values,
        fill: false,
        borderColor: 'red',
        yAxisID: 'hp',
      }],
  }
}

function render_chart () {
  draw = false
  let ctx = document.getElementById('myChart')
  let myChart = new Chart(ctx, {
    type: 'line',
    data: build_points(),
    options: {
      elements: {
        point: {
          radius: 0,
        },
      },
      animation: {
        duration: 0,
      },
      legend: {
        display: true,
      },
      scales: {
        yAxes: [
          {
            id: 'mana',
            ticks: {
              display: false,
              max: 10000,
              beginAtZero: true,
            },
          }, {
            id: 'hp',
            ticks: {
              display: false,
              max: maxHp,
              beginAtZero: true,
            },
          }],
      },
    },
  })
}

function log_mana (e) {
  let mana = e['detail']['currentMP']
  let hp = e['detail']['currentHP']
  maxHp = e['detail']['maxHP']
  if (mana !== last_mana || hp !== last_hp) {
    draw = true
    let time = Date.now()
    mana_values.push(mana)
    hp_values.push(hp)
    time_values.push(time)
    last_mana = mana
    last_hp = hp
  }
}

window.addEventListener('DOMContentLoaded', async (e) => {
  addOverlayListener('onPlayerChangedEvent', (e) => {
    if (inCombat) log_mana(e)
    if (draw) render_chart()
  })
  addOverlayListener('onInCombatChangedEvent', (e) => {
    mana_values = []
    hp_values = []
    time_values = []
    inCombat = e.detail['inGameCombat']
  })

  startOverlayEvents()

  console.log('mana chart loaded')

})
