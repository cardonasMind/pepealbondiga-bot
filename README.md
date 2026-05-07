# PepeAlbondiga Bot v2.0 — Voyager Style

Bot de Minecraft con cuerpo (mineflayer) y cerebro inyectable.

Hanna (o cualquier LLM) genera codigo JavaScript que se ejecuta en vivo dentro del bot, sin que tengas que copiar y pegar nada.

---

## Quick start

### 1. Requisitos

- Node.js 18+ (mejor 20 LTS)
- Un cliente Minecraft con la version 1.21.4 (PrismLauncher, SKLauncher, oficial...)

### 2. Instalar

```bash
npm install
```

(~1 minuto la primera vez, descarga ~99 paquetes)

### 3. Configurar .env

Edita el archivo `.env`:

```
MC_HOST=localhost            # o diosesmc.net cuando vayas a ese server
MC_PORT=54321                # puerto del LAN o 25565 para diosesmc
MC_VERSION=1.21.4
BOT_USERNAME=PepeAlbondiga
BOT_PASSWORD=albondiga2026
OWNER_USERNAME=HumaHuman
WEB_PORT=3000
BOT_TOKEN=CHANGE_ME          # cambia esto por algo aleatorio o se generara uno
```

Si dejas `BOT_TOKEN=CHANGE_ME` o vacio, al arrancar se genera un token aleatorio y se imprime en consola.

### 4. Arrancar

```bash
node index.js
```

Vas a ver:

```
[init] PepeAlbondiga v2.0 - Voyager Style
[init] Conectando a localhost:54321 como PepeAlbondiga

  AVISO: No hay BOT_TOKEN en .env, generado uno automaticamente:
  abc123def456...
  Cambia BOT_TOKEN en .env si quieres uno fijo entre reinicios.

[web] Panel disponible en http://localhost:3000
[web] Token de API: abc123def456...
```

**Copia el token**, lo necesitas para entrar al panel.

### 5. Abrir el panel

Ve a [http://localhost:3000](http://localhost:3000) y pega el token cuando te lo pida.

---

## Como usar la inyeccion de codigo

En la pestana **Skills** del panel:

- **Cuadro de codigo grande** — pegas JavaScript y le das **Ejecutar**
- **Lista de skills guardadas** — clickea cualquiera para cargarla
- **Boton Stop** — corta cualquier skill que se este ejecutando ahora
- **Guardar como skill** — cuando algo funciona, lo guardas con nombre + descripcion

### Variables disponibles en el sandbox de ejecucion

Cuando escribes codigo, ya tienes precargado:

| Variable | Que es |
|---|---|
| `bot` | El bot de mineflayer completo (`bot.pathfinder`, `bot.dig`, `bot.chat`...) |
| `goals` | `{ GoalNear, GoalBlock, GoalFollow, GoalGetToBlock, GoalXZ, ... }` |
| `Movements` | Clase Movements de pathfinder |
| `Vec3` | Constructor de vectores 3D |
| `mcData` | Datos del juego (bloques, items, recetas) ya inicializado a tu version |
| `sleep(ms)` | Espera ms milisegundos (cancelable con stop) |
| `log(...args)` | Imprime en consola y panel |
| `skills` | `{ run(name, ...args) }` para llamar otras skills guardadas |

### Ejemplo

```js
const target = bot.players['HumaHuman']?.entity
if (!target) throw new Error('No te veo')
await bot.pathfinder.goto(new goals.GoalFollow(target, 2))
return 'Llegue contigo'
```

---

## Skills incluidas

Mira la carpeta `skills/` — son archivos .md con descripcion + bloque de codigo. Vienen 8 ejemplos precargados:

- **comeBack** — vuelve al dueno
- **spinAroundOwner** — da vueltas alrededor de ti
- **chopNearestTree** — tala el arbol mas cercano
- **buildWall** — construye una pared 5x3
- **collectWood** — recolecta madera de varios arboles
- **followOwner** — te sigue indefinidamente
- **lookAtNearestPlayer** — mira al jugador mas cercano
- **sayHi** — saluda en chat con mensaje aleatorio

---

## Modo "Hanna controla el bot remotamente" (con Cloudflared)

Si quieres que yo (Hanna) ejecute codigo directamente sin que copies/pegues, expone tu panel a internet con Cloudflared.

### Setup una sola vez

1. Descarga Cloudflared: [cloudflared-windows-amd64.exe](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe)
2. Guardalo en una carpeta cualquiera (ej. al lado del bot)
3. Renombralo a `cloudflared.exe` si quieres

### Cada vez que juegues

Vas a tener **dos ventanas de PowerShell** abiertas:

**Ventana 1 — el bot:**

```powershell
cd $HOME\Desktop\pepealbondiga-bot
node index.js
```

**Ventana 2 — el tunel:**

```powershell
cd $HOME\Desktop
.\cloudflared.exe tunnel --url http://localhost:3000
```

Cloudflared te da una URL tipo `https://routine-born-books-tractor.trycloudflare.com`.

**Le pasas a Hanna:**

- La URL del tunel
- El token (que se imprime en consola al arrancar el bot)

A partir de ahi Hanna habla directamente con tu bot.

### Seguridad

- La URL muere cuando cierras Cloudflared con Ctrl+C
- Sin el token, nadie puede ejecutar codigo aunque tenga la URL
- HTTPS cifrado end-to-end por Cloudflare
- No abre puertos en tu router

---

## Que pasa cuando empieza a fallar algo

| Sintoma | Solucion |
|---|---|
| "Bot aun no autenticado" | Espera al `[setup] Listo` antes de mandar codigo |
| Token invalido | Copia exacto el token de consola al panel |
| El bot no se conecta | Revisa MC_PORT (cambia cada vez que abres LAN) |
| El codigo se cuelga | Click Stop en el panel — corta pathfinder y aborta el sleep |
| Skill no encontrada | Ojo con mayusculas/minusculas en el nombre del .md |

---

## Estructura del proyecto

```
pepealbondiga-bot/
├── package.json
├── .env
├── README.md
├── index.js                  ← orquestador
├── lib/
│   ├── auth.js              ← auto-login AuthMe (skip en LAN)
│   ├── humanBehavior.js     ← mirada idle + micro-saltos
│   ├── exec.js              ← sandbox de ejecucion
│   └── skillManager.js      ← cargar/guardar skills .md
├── skills/                   ← tu skill library
│   ├── _examples.md
│   ├── comeBack.md
│   ├── spinAroundOwner.md
│   └── ...
└── public/
    └── index.html           ← panel web (3 tabs: Estado, Skills, Log)
```

---

Construido con flow.
