let socket = new WebSocket('ws://localhost:6789')
socket.onmessage = function (event) {
  console.log(event.data)
}