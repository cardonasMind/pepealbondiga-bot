# followOwner

Sigue al dueno indefinidamente manteniendo distancia de 2 bloques. Usa stop para detenerlo.

**Tags:** movimiento, continuo

## Codigo

```js
const owner = process.env.OWNER_USERNAME || 'HumaHuman'
const target = bot.players[owner]?.entity
if (!target) throw new Error('No veo a ' + owner)

bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true)
log('[follow] Siguiendo a ' + owner + ' (usa stop para parar)')

// Esperar hasta que se cancele desde fuera
while (true) {
  await sleep(500)
}
```
