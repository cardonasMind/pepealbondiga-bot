# spinAroundOwner

Da una vuelta completa alrededor del dueno saltando ocasionalmente. Acepta opcionalmente cantidad de vueltas (default 1) y radio en bloques (default 3).

**Tags:** movimiento, divertido, pathfinder

## Codigo

```js
const owner = process.env.OWNER_USERNAME || 'HumaHuman'
const target = bot.players[owner]?.entity
if (!target) throw new Error('No veo a ' + owner)

const turns = 1
const radius = 3

for (let t = 0; t < turns; t++) {
  for (let angle = 0; angle < 360; angle += 30) {
    const rad = angle * Math.PI / 180
    const offset = new Vec3(Math.cos(rad) * radius, 0, Math.sin(rad) * radius)
    const dest = target.position.plus(offset)
    await bot.pathfinder.goto(new goals.GoalNear(dest.x, dest.y, dest.z, 0.8))
    if (Math.random() < 0.4) {
      bot.setControlState('jump', true)
      await sleep(200)
      bot.setControlState('jump', false)
    }
  }
}
return 'Vueltas completadas: ' + turns
```
