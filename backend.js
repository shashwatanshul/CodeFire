const express = require('express')
const app = express()

// socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {}
const backEndProjectiles = {}

const SPEED = 5
const RADIUS = 10
const PROJECTILE_RADIUS = 5
let projectileId = 0

io.on('connection', (socket) => {
  console.log('a user connected')

  io.emit('updatePlayers', backEndPlayers)

  // socket.on('shoot', ({ x, y, angle }) => {
  //   projectileId++

  //   const velocity = {
  //     x: Math.cos(angle) * 5,
  //     y: Math.sin(angle) * 5
  //   }

  //   backEndProjectiles[projectileId] = {
  //     x,
  //     y,
  //     velocity,
  //     playerId: socket.id
  //   }

  //   console.log(backEndProjectiles)
  // })

  // In the shoot handler
  socket.on('shoot', ({ angle, tempId }) => {
    const player = backEndPlayers[socket.id]
    if (!player) return

    // Always use server's authoritative position
    const projectileId = tempId || Date.now().toString()
    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    backEndProjectiles[projectileId] = {
      x: player.x, // SERVER AUTHORITATIVE POSITION
      y: player.y,
      velocity,
      playerId: socket.id
    }

    // Immediate update for better sync
    io.emit('updateProjectiles', backEndProjectiles)
  })

  socket.on('initGame', ({ username, width, height }) => {
    backEndPlayers[socket.id] = {
      x: 1024 * Math.random(),
      y: 576 * Math.random(),
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username
    }

    // where we init our canvas
    backEndPlayers[socket.id].canvas = {
      width,
      height
    }

    backEndPlayers[socket.id].radius = RADIUS
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    const backEndPlayer = backEndPlayers[socket.id]

    if (!backEndPlayers[socket.id]) return

    backEndPlayers[socket.id].sequenceNumber = sequenceNumber
    switch (keycode) {
      case 'KeyW':
        backEndPlayers[socket.id].y -= SPEED
        break

      case 'KeyA':
        backEndPlayers[socket.id].x -= SPEED
        break

      case 'KeyS':
        backEndPlayers[socket.id].y += SPEED
        break

      case 'KeyD':
        backEndPlayers[socket.id].x += SPEED
        break
    }

    const playerSides = {
      left: backEndPlayer.x - backEndPlayer.radius,
      right: backEndPlayer.x + backEndPlayer.radius,
      top: backEndPlayer.y - backEndPlayer.radius,
      bottom: backEndPlayer.y + backEndPlayer.radius
    }

    if (playerSides.left < 0) backEndPlayers[socket.id].x = backEndPlayer.radius

    if (playerSides.right > 1024)
      backEndPlayers[socket.id].x = 1024 - backEndPlayer.radius

    if (playerSides.top < 0) backEndPlayers[socket.id].y = backEndPlayer.radius

    if (playerSides.bottom > 576)
      backEndPlayers[socket.id].y = 576 - backEndPlayer.radius
  })
})

// backend ticker
// In backend.js setInterval callback
setInterval(() => {
  // Update projectile positions
  for (const id in backEndProjectiles) {
    const projectile = backEndProjectiles[id]

    // Update position
    projectile.x += projectile.velocity.x
    projectile.y += projectile.velocity.y

    // Boundary checks
    const PROJECTILE_RADIUS = 5
    if (
      projectile.x - PROJECTILE_RADIUS > 1024 ||
      projectile.x + PROJECTILE_RADIUS < 0 ||
      projectile.y - PROJECTILE_RADIUS > 576 ||
      projectile.y + PROJECTILE_RADIUS < 0
    ) {
      delete backEndProjectiles[id]
      continue
    }

    // Position validation (anti-cheat)
    const owner = backEndPlayers[projectile.playerId]
    if (owner) {
      const distanceFromOwner = Math.hypot(
        projectile.x - owner.x,
        projectile.y - owner.y
      )

      // Allow projectiles to be max 100ms old (5px/15ms * 7 frames)
      const maxValidDistance = 5 * (100 / 15) + owner.radius + PROJECTILE_RADIUS

      if (distanceFromOwner > maxValidDistance) {
        delete backEndProjectiles[id]
        continue
      }
    }

    // Player collision detection
    for (const playerId in backEndPlayers) {
      const player = backEndPlayers[playerId]

      // Skip collision with owner
      if (projectile.playerId === playerId) continue

      const distance = Math.hypot(
        projectile.x - player.x,
        projectile.y - player.y
      )

      if (distance < PROJECTILE_RADIUS + player.radius) {
        // Handle score update
        if (backEndPlayers[projectile.playerId]) {
          backEndPlayers[projectile.playerId].score += 1
        }

        // Remove entities
        delete backEndProjectiles[id]
        delete backEndPlayers[playerId]
        break
      }
    }
  }

  // Emit updates
  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers)
}, 15)

server.listen(process.env.PORT, () => {
  console.log(`Example app listening on port`)
})

console.log('server did load')
