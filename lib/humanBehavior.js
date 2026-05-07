// Comportamientos que hacen que el bot parezca humano:
// - Mirada idle (gira la cabeza cada 3-8s)
// - Micro-saltos ocasionales mientras camina (bunny hop)
// - Pausas pensativas
// - Typos ocasionales en chat (configurable)

function rand(min, max) { return Math.random() * (max - min) + min }
function randInt(min, max) { return Math.floor(rand(min, max + 1)) }

let started = false
let stopFlag = false

function start(bot, log) {
  if (started === true) return
  started = true
  stopFlag = false

  // Idle look: mirada que se mueve sola
  function idleLook() {
    if (stopFlag === true) return
    if (bot.entity === undefined || bot.entity === null) {
      setTimeout(idleLook, 2000)
      return
    }
    const yaw = bot.entity.yaw + rand(-0.8, 0.8)
    const pitch = rand(-0.3, 0.3)
    bot.look(yaw, pitch, false)
    setTimeout(idleLook, randInt(3000, 8000))
  }
  setTimeout(idleLook, randInt(2000, 5000))

  // Micro-saltos al caminar (bunny hop)
  function maybeJump() {
    if (stopFlag === true) return
    const goalActive = bot.pathfinder.goal !== null && bot.pathfinder.goal !== undefined
    if (goalActive === true && Math.random() < 0.25) {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 200)
    }
    setTimeout(maybeJump, randInt(4000, 12000))
  }
  setTimeout(maybeJump, randInt(5000, 10000))

  log('[human] Comportamientos humanos activos')
}

function stop() {
  stopFlag = true
  started = false
}

// Helper para enviar mensajes con typos ocasionales
function chatWithTypos(bot, message, typoRate) {
  const rate = typoRate === undefined ? 0.05 : typoRate
  let result = ''
  for (const ch of message) {
    if (Math.random() < rate && ch.match(/[a-zA-Z]/)) {
      const adjacent = {
        a: 's', s: 'd', d: 'f', f: 'g', g: 'h', h: 'j', j: 'k', k: 'l',
        q: 'w', w: 'e', e: 'r', r: 't', t: 'y', y: 'u', u: 'i', i: 'o',
        z: 'x', x: 'c', c: 'v', v: 'b', b: 'n', n: 'm'
      }
      const lower = ch.toLowerCase()
      if (adjacent[lower] !== undefined) {
        result += adjacent[lower]
        continue
      }
    }
    result += ch
  }
  bot.chat(result)
}

module.exports = { start, stop, chatWithTypos }
