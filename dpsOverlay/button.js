'use strict';

import { options, saveButtonState } from './options.js'

function updateButtonColor (button) {
  try {
    if (options[button.textContent]) button.style.color = 'green'
    else button.style.color = 'red'
  } catch (e) { }
}

function turnPlayerColorPurple () {
  let button = document.querySelector('.buttonPCPurple')
  options[button.textContent] = !options[button.textContent]
  saveButtonState('playerColorPurple', button)
  updateButtonColor(button)
}

export {updateButtonColor, turnPlayerColorPurple}

