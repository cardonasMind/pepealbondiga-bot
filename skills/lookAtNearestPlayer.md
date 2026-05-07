# lookAtNearestPlayer

Mira al jugador mas cercano (que no sea el bot). Util para hacer contacto visual antes de hablar.

**Tags:** interaccion, basico

## Codigo

```js
const others = Object.values(bot.players)
  .filter(p => p.username !== bot.username && p.entity)
  .sort((a, b) => bot.entity.position.distanceTo(a.entity.position) - bot.entity.position.distanceTo(b.entity.position))

if (others.length === 0) throw new Error('No hay nadie cerca')
const target = others[0]
const head = target.entity.position.offset(0, target.entity.height || 1.6, 0)
await bot.lookAt(head, true)
return 'Mirando a ' + target.username
```
