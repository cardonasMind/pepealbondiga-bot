# chopNearestTree

Encuentra el arbol mas cercano (cualquier tipo de log) y lo tala completo de abajo hacia arriba. Equipa la mejor herramienta automaticamente.

**Tags:** recoleccion, madera, basico

## Codigo

```js
const tree = bot.findBlock({
  matching: block => block.name.endsWith('_log'),
  maxDistance: 32
})
if (!tree) throw new Error('No hay arboles cerca (32 bloques)')

log('[chop] Encontre ' + tree.name + ' en ' + tree.position)

await bot.tool.equipForBlock(tree)
await bot.pathfinder.goto(new goals.GoalGetToBlock(tree.position.x, tree.position.y, tree.position.z))

let count = 0
let current = tree
while (current && current.name.endsWith('_log')) {
  await bot.dig(current)
  count++
  current = bot.blockAt(current.position.offset(0, 1, 0))
}
return 'Tale ' + count + ' bloques de ' + tree.name
```
