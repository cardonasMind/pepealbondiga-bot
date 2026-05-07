// Sandbox de ejecucion: recibe codigo JavaScript como string,
// lo envuelve en async function y lo ejecuta con bot, goals, Vec3, mcData,
// sleep, log y skills precargados como variables.

const { goals, Movements } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')

let currentExecution = null  // { abortController, promise, code, startedAt }

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRunning() {
  return currentExecution !== null
}

async function execute(bot, code, log, skillRunner) {
  if (currentExecution !== null) {
    throw new Error('Ya hay codigo ejecutandose. Usa stop() primero.')
  }

  const mcData = require('minecraft-data')(bot.version)
  const abortController = new AbortController()
  const startedAt = Date.now()

  // Sleep que respeta el aborto
  const abortableSleep = (ms) => new Promise((resolve, reject) => {
    if (abortController.signal.aborted) {
      reject(new Error('Aborted'))
      return
    }
    const timer = setTimeout(resolve, ms)
    abortController.signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error('Aborted'))
    })
  })

  // Helper para llamar skills guardadas dentro del codigo
  const skills = {
    run: async (name, ...args) => {
      if (typeof skillRunner !== 'function') throw new Error('Skill runner no disponible')
      return skillRunner(name, ...args)
    },
    list: () => {
      if (typeof skillRunner !== 'function') return []
      return skillRunner('__list__')
    }
  }

  // Construir async function
  const wrapped = 'return (async () => {\n' + code + '\n})()'
  let fn
  try {
    fn = new Function('bot', 'goals', 'Movements', 'Vec3', 'mcData', 'sleep', 'log', 'skills', wrapped)
  } catch (compileErr) {
    throw new Error('Error de sintaxis: ' + compileErr.message)
  }

  const promise = fn(bot, goals, Movements, Vec3, mcData, abortableSleep, log, skills)
    .then(result => {
      const duration = Date.now() - startedAt
      log('[exec] OK (' + duration + 'ms)' + (result !== undefined ? ' -> ' + JSON.stringify(result) : ''))
      currentExecution = null
      return { ok: true, result: result, durationMs: duration }
    })
    .catch(err => {
      const duration = Date.now() - startedAt
      const msg = err.message || String(err)
      log('[exec] ERR (' + duration + 'ms): ' + msg)
      currentExecution = null
      return { ok: false, error: msg, durationMs: duration }
    })

  currentExecution = { abortController, promise, code, startedAt }
  return promise
}

function stop(bot) {
  if (currentExecution === null) {
    return { ok: false, msg: 'Nada ejecutandose' }
  }
  try {
    currentExecution.abortController.abort()
  } catch (e) {}

  // Tambien parar pathfinder y controles fisicos
  try { bot.pathfinder.setGoal(null) } catch (e) {}
  try {
    bot.setControlState('forward', false)
    bot.setControlState('back', false)
    bot.setControlState('left', false)
    bot.setControlState('right', false)
    bot.setControlState('jump', false)
    bot.setControlState('sprint', false)
    bot.setControlState('sneak', false)
  } catch (e) {}

  return { ok: true, msg: 'Stop enviado, codigo cancelado' }
}

function getStatus() {
  if (currentExecution === null) return { running: false }
  return {
    running: true,
    runningForMs: Date.now() - currentExecution.startedAt,
    codePreview: currentExecution.code.slice(0, 200)
  }
}

module.exports = { execute, stop, isRunning, getStatus, sleep }
