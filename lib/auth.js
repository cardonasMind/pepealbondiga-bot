// Auto-login con AuthMe (servers cracked tipo diosesmc)
// Detecta mensajes del server pidiendo /register o /login y los manda solos.

function rand(min, max) { return Math.random() * (max - min) + min }
function randInt(min, max) { return Math.floor(rand(min, max + 1)) }

function attachAuth(bot, config, log, onAuthReady) {
  let registered = false
  let loginAttempted = false

  // Si estamos en localhost (LAN local), no hay AuthMe - skip directo
  if (config.host === 'localhost' || config.host === '127.0.0.1') {
    bot.once('spawn', () => {
      log('[auth] LAN local detectado, saltando autenticacion')
      setTimeout(() => onAuthReady(), 1500)
    })
    return
  }

  bot.on('messagestr', (message) => {
    const msg = message.toLowerCase()

    const needsRegister = msg.indexOf('/register') >= 0 ||
                          msg.indexOf('registrate') >= 0 ||
                          msg.indexOf('regístrate') >= 0 ||
                          msg.indexOf('register') >= 0
    if (registered === false && needsRegister) {
      setTimeout(() => {
        log('[auth] Enviando /register...')
        bot.chat('/register ' + config.password + ' ' + config.password)
        registered = true
      }, randInt(1200, 2200))
    }

    const needsLogin = msg.indexOf('/login') >= 0 ||
                       msg.indexOf('inicia sesion') >= 0 ||
                       msg.indexOf('inicia sesión') >= 0 ||
                       msg.indexOf('login') >= 0
    if (loginAttempted === false && needsLogin) {
      setTimeout(() => {
        log('[auth] Enviando /login...')
        bot.chat('/login ' + config.password)
        loginAttempted = true
      }, randInt(1200, 2200))
    }

    const success = msg.indexOf('registrado correctamente') >= 0 ||
                    msg.indexOf('successfully registered') >= 0 ||
                    msg.indexOf('sesión iniciada') >= 0 ||
                    msg.indexOf('logged in') >= 0 ||
                    msg.indexOf('logueado') >= 0
    if (success) {
      log('[auth] OK Autenticacion exitosa')
      setTimeout(() => onAuthReady(), 2000)
    }
  })
}

module.exports = { attachAuth }
