# comeBack

Camina de vuelta hacia el dueno (la variable OWNER se lee del .env). Si no lo ve, busca al jugador mas cercano.

**Tags:** movimiento, basico, pathfinder

## Codigo

```js
const owner = process.env.OWNER_USERNAME || 'HumaHuman'
let target = bot.players[owner]?.entity

if (!target) {
  log('[comeBack] No veo a ' + owner + ', busco al jugador mas cercano')
  const others = Object.values(bot.players)
    .filter(p => p.username !== bot.username && p.entity)
    .sort((a, b) => bot.entity.position.distanceTo(a.entity.position) - bot.entity.position.distanceTo(b.entity.position))
  if (others.length === 0) throw new Error('No hay jugadores en rango')
  target = others[0].entity
}

await bot.pathfinder.goto(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2))
return 'Llegue contigo'
```
