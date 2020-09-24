'use strict'

import { updateButtonColor } from './button.js'

let options = {}

function hideOptions () {
  toggleOptions()
  document.querySelector('.buttonOptions').style.display = 'none'
}

function toggleOptions () {
  let button = document.querySelector('.buttonOptions')
  let options = document.querySelector('.options')
  options['toggle'] = !options['toggle']
  if (options['toggle']) {
    button.style.color = 'green'
    options.style.display = 'block'
    options.childNodes.forEach((node) => {
      updateButtonColor(node)
    })
  } else {
    button.style.color = 'red'
    options.style.display = 'none'
  }
}

options['toggle'] = false

function saveButtonState (key, button) {
  let value = options[button.textContent]
  callOverlayHandler(
    {
      call: 'saveData',
      key: key,
      data: value,
    }).
    then(saveDataCallbackSuccess(button, value),
      saveDataCallbackFailure(button))
}

function saveDataCallbackSuccess (button, value) {
  return _ => {
    console.log(`saved button '${button.textContent}', value ${value}`)
  }
}

function saveDataCallbackFailure (button) {
  return _ => {
    console.log(`failed to save button '${button.textContent}'`)
  }
}

function loadDataCallback (key, button, defaultValue = true) {
  return e => {
    if (e == null) {
      options[button.textContent] = defaultValue
      console.log(
        `initialized button '${button.textContent}' to ${defaultValue}`)
      saveButtonState(key, button)
    } else {
      options[button.textContent] = e['data']
      console.log(`loaded button '${button.textContent}', value ${e['data']}`)
    }
  }

}

function initOptions () {
  document.querySelector('.buttonOptions').style.color = 'red'
  let button = document.querySelector('.buttonPCPurple')
  let key = 'playerColorPurple'
  callOverlayHandler({
    call: 'loadData',
    key: key,
  }).then(loadDataCallback(key, button))
  updateButtonColor(button)
}

export { initOptions, saveButtonState, toggleOptions, options, hideOptions }
