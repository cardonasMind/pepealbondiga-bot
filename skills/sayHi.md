# sayHi

Saluda en el chat con un mensaje aleatorio variado, con un pequeno delay humano antes de mandarlo.

**Tags:** chat, social

## Codigo

```js
const greetings = [
  'hola',
  'que tal',
  'buenas',
  'ola gente',
  'hi',
  'eyy',
  'que pasa',
  'saluditos',
  'buenas buenas',
  'hellou'
]
const msg = greetings[Math.floor(Math.random() * greetings.length)]
const delay = 600 + Math.random() * 1400
await sleep(delay)
bot.chat(msg)
return 'Salude con: ' + msg
```
