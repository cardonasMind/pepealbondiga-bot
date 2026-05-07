# collectWood

Camina y recolecta madera de varios arboles cercanos hasta juntar al menos 16 logs. Usa el plugin collectBlock.

**Tags:** recoleccion, madera, avanzado

## Codigo

```js
const target = 16
let collected = 0
const initial = bot.inventory.count(mcData.itemsByName.oak_log?.id ?? 0)

for (let attempt = 0; attempt < 8 && collected < target; attempt++) {
  const tree = bot.findBlock({
    matching: block => block.name.endsWith('_log'),
    maxDistance: 64
  })
  if (!tree) {
    log('[wood] No hay mas arboles cerca, paro')
    break
  }
  log('[wood] Voy por arbol en ' + tree.position)
  try {
    await bot.collectBlock.collect(tree)
  } catch (e) {
    log('[wood] Error con este arbol: ' + e.message + ', sigo con otro')
  }
  // Recontar logs en el inventario
  let total = 0
  for (const item of bot.inventory.items()) {
    if (item.name.endsWith('_log')) total += item.count
  }
  collected = total
  log('[wood] Llevo ' + collected + ' logs')
}
return 'Recolecte ' + collected + ' logs'
```
