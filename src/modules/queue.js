import EventEmitter from 'node:events'
const event = new EventEmitter()

let queue = []
let maxConcurrent = 10
let currentRunning = 0
let waitingList = []

function addTask(command) {
  if (currentRunning < maxConcurrent) {
    executeTask(command)
  } else {
    waitingList.push(command)
  }

  event.emit('queueChanged', queue.length)
}

function executeTask(command) {
  currentRunning++
  queue.push(command)
  event.emit('queueChanged', queue.length)

  command().then(() => {
    currentRunning--
    queue.splice(queue.indexOf(command), 1)
    event.emit('queueChanged', queue.length)

    if (waitingList.length > 0) {
      executeTask(waitingList.shift())
    }
  })
}

event.on('queueChanged', (queueLength) => {
  console.log(`Queue length changed to ${queueLength}`)
})