# buildWall

Construye una pared simple de 5 bloques de ancho por 3 de alto delante del bot, usando el primer bloque colocable que tenga en el inventario.

**Tags:** construccion, basico

## Codigo

```js
const placeable = bot.inventory.items().find(item => {
  const block = mcData.blocksByName[item.name]
  return block !== undefined
})
if (!placeable) throw new Error('No tengo bloques colocables en el inventario')

await bot.equip(placeable, 'hand')
log('[build] Construyendo pared con ' + placeable.name)

const yaw = bot.entity.yaw
const forward = new Vec3(-Math.sin(yaw), 0, -Math.cos(yaw)).floored()
const right = new Vec3(Math.cos(yaw), 0, -Math.sin(yaw)).floored()
const startPos = bot.entity.position.floored().plus(forward.scaled(2))

let placed = 0
for (let h = 0; h < 3; h++) {
  for (let w = -2; w <= 2; w++) {
    const target = startPos.plus(right.scaled(w)).offset(0, h, 0)
    const refBlock = bot.blockAt(target.offset(0, -1, 0))
    if (!refBlock || refBlock.name === 'air') continue
    try {
      await bot.placeBlock(refBlock, new Vec3(0, 1, 0))
      placed++
      await sleep(150)
    } catch (e) {
      log('[build] Skip bloque ' + target + ': ' + e.message)
    }
  }
}
return 'Coloque ' + placed + ' bloques'
```
