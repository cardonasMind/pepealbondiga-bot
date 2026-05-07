require('dotenv').config()
const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const autoEat = require('mineflayer-auto-eat').loader
const armorManager = require('mineflayer-armor-manager')
const collectBlock = require('mineflayer-collectblock').plugin
const toolPlugin = require('mineflayer-tool').plugin
const express = require('express')
const path = require('path')
const http = require('http')
const crypto = require('crypto')
const { WebSocketServer } = require('ws')

const auth = require('./lib/auth')
const human = require('./lib/humanBehavior')
const exec = require('./lib/exec')
const skillManager = require('./lib/skillManager')

const config = {
  host: process.env.MC_HOST,
  port: parseInt(process.env.MC_PORT) || 25565,
  username: process.env.BOT_USERNAME,
  password: process.env.BOT_PASSWORD,
  version: process.env.MC_VERSION === 'false' ? false : process.env.MC_VERSION,
  webPort: parseInt(process.env.WEB_PORT) || 3000,
  ownerUsername: process.env.OWNER_USERNAME || '',
  botToken: process.env.BOT_TOKEN || ''
}

// Si no hay token configurado, generar uno automaticamente y avisar
if (config.botToken === '' || config.botToken === 'CHANGE_ME') {
  config.botToken = crypto.randomBytes(24).toString('hex')
  console.log('')
  console.log('=' .repeat(70))
  console.log('  AVISO: No hay BOT_TOKEN en .env, generado uno automaticamente:')
  console.log('  ' + config.botToken)
  console.log('  Cambia BOT_TOKEN en .env si quieres uno fijo entre reinicios.')
  console.log('=' .repeat(70))
  console.log('')
}

console.log('[init] PepeAlbondiga v2.0 - Voyager Style')
console.log('[init] Conectando a ' + config.host + ':' + config.port + ' como ' + config.username)

const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  version: config.version,
  auth: 'offline',
  checkTimeoutInterval: 60000,
  keepAlive: true,
  skipValidation: true
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(autoEat)
bot.loadPlugin(armorManager)
bot.loadPlugin(collectBlock)
bot.loadPlugin(toolPlugin)

let authReady = false
let movementsReady = false

const app = express()
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json({ limit: '10mb' }))
const server = http.createServer(app)
const wss = new WebSocketServer({ server })
const wsClients = new Set()

function broadcast(type, payload) {
  const msg = JSON.stringify({ type: type, payload: payload, ts: Date.now() })
  for (const ws of wsClients) {
    if (ws.readyState === 1) ws.send(msg)
  }
}

function log(...args) {
  const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
  console.log(msg)
  broadcast('log', msg)
}

wss.on('connection', (ws) => {
  wsClients.add(ws)
  ws.on('close', () => wsClients.delete(ws))
  ws.send(JSON.stringify({ type: 'state', payload: getBotState() }))
})

function getBotState() {
  const ent = bot.entity
  const hasEnt = ent !== undefined && ent !== null
  return {
    connected: authReady,
    username: config.username,
    pos: hasEnt === true ? {
      x: Math.round(ent.position.x),
      y: Math.round(ent.position.y),
      z: Math.round(ent.position.z)
    } : null,
    health: hasEnt === true ? bot.health : null,
    food: hasEnt === true ? bot.food : null,
    players: Object.keys(bot.players || {}),
    version: bot.version || config.version,
    execStatus: exec.getStatus()
  }
}

auth.attachAuth(bot, config, log, () => {
  authReady = true
  setupAfterAuth()
  broadcast('state', getBotState())
})

bot.on('login', () => log('[login] Conectado al server'))
bot.once('spawn', () => log('[spawn] Spawneado en ' + JSON.stringify(bot.entity.position)))

function setupAfterAuth() {
  if (movementsReady === true) return
  log('[setup] Configurando pathfinder, auto-eat y comportamientos...')

  const mcData = require('minecraft-data')(bot.version)
  const movements = new Movements(bot, mcData)
  movements.allowSprinting = true
  movements.allowParkour = true
  movements.canDig = false
  movements.allow1by1towers = false
  bot.pathfinder.setMovements(movements)

  bot.autoEat.options = {
    priority: 'foodPoints',
    startAt: 14,
    bannedFood: ['rotten_flesh', 'spider_eye', 'poisonous_potato', 'pufferfish', 'chicken']
  }

  movementsReady = true
  human.start(bot, log)
  log('[setup] Listo. PepeAlbondiga v2.0 esperando ordenes.')
}

bot.on('autoeat_started', () => log('[eat] Comiendo...'))
bot.on('autoeat_stopped', () => log('[eat] Termine de comer'))
bot.on('goal_reached', () => log('[path] Llegue al destino'))
bot.on('health', () => broadcast('state', getBotState()))

setInterval(() => {
  if (wsClients.size > 0) broadcast('state', getBotState())
}, 2000)

// ============================================================
// MIDDLEWARE DE TOKEN: protege endpoints sensibles
// ============================================================
function requireToken(req, res, next) {
  const provided = req.headers['x-bot-token'] || req.query.token
  if (provided !== config.botToken) {
    return res.status(401).json({ ok: false, error: 'Token invalido o faltante' })
  }
  next()
}

// Endpoint publico para chequeo de salud (sin token)
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, version: '2.0.0', authReady: authReady })
})

// Endpoint publico para que Hanna sepa el estado actual sin auth
app.get('/api/state', (req, res) => {
  res.json({ ok: true, state: getBotState() })
})

// ============================================================
// API REST PROTEGIDA - Sandbox de ejecucion
// ============================================================

async function skillRunner(name, ...args) {
  if (name === '__list__') return skillManager.listSkills().map(s => s.name)
  const code = skillManager.loadSkillCode(name)
  return exec.execute(bot, code, log, skillRunner)
}

app.post('/api/exec', requireToken, async (req, res) => {
  const code = req.body.code
  if (typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'Falta el campo code' })
  }
  if (authReady === false) {
    return res.status(400).json({ ok: false, error: 'Bot aun no autenticado' })
  }
  log('[exec] Iniciando ejecucion (' + code.length + ' chars)')
  try {
    const result = await exec.execute(bot, code, log, skillRunner)
    broadcast('state', getBotState())
    res.json(result)
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.post('/api/stop', requireToken, (req, res) => {
  const result = exec.stop(bot)
  broadcast('state', getBotState())
  res.json(result)
})

app.get('/api/skills', requireToken, (req, res) => {
  try {
    res.json({ ok: true, skills: skillManager.listSkills() })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get('/api/skills/:name', requireToken, (req, res) => {
  try {
    const full = skillManager.loadSkillFull(req.params.name)
    res.json({ ok: true, ...full })
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message })
  }
})

app.post('/api/skills', requireToken, (req, res) => {
  const { name, code, description, tags } = req.body
  if (typeof name !== 'string' || typeof code !== 'string') {
    return res.status(400).json({ ok: false, error: 'Faltan name o code' })
  }
  try {
    const result = skillManager.saveSkill(name, code, description, tags)
    log('[skill] Guardada: ' + result.name)
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

app.delete('/api/skills/:name', requireToken, (req, res) => {
  try {
    const result = skillManager.deleteSkill(req.params.name)
    log('[skill] Borrada: ' + result.name)
    res.json(result)
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

app.post('/api/cmd', requireToken, async (req, res) => {
  const cmd = (req.body.cmd || '').trim()
  const args = req.body.args || []
  res.json(await runQuickCmd(cmd, args))
})

async function runQuickCmd(cmd, args) {
  if (authReady === false && cmd !== 'quit' && cmd !== 'say') {
    return { ok: false, msg: 'Bot no autenticado aun' }
  }
  switch (cmd) {
    case 'pos': {
      const p = bot.entity.position
      return { ok: true, msg: 'x=' + Math.round(p.x) + ' y=' + Math.round(p.y) + ' z=' + Math.round(p.z) }
    }
    case 'jump': {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 250)
      return { ok: true, msg: 'Salto' }
    }
    case 'say': {
      const txt = args.join(' ')
      if (txt.length === 0) return { ok: false, msg: 'Mensaje vacio' }
      bot.chat(txt)
      return { ok: true, msg: 'Enviado: ' + txt }
    }
    case 'stop': {
      return exec.stop(bot)
    }
    case 'quit': {
      bot.quit()
      setTimeout(() => process.exit(0), 500)
      return { ok: true, msg: 'Cerrando...' }
    }
    default:
      return { ok: false, msg: 'Comando desconocido: ' + cmd }
  }
}

bot.on('kicked', (reason) => log('[kicked] ' + JSON.stringify(reason)))
bot.on('error', (err) => log('[error] ' + err.message))
bot.on('end', (reason) => {
  log('[end] ' + reason)
  process.exit(0)
})

server.listen(config.webPort, () => {
  console.log('[web] Panel disponible en http://localhost:' + config.webPort)
  console.log('[web] Token de API: ' + config.botToken)
})
