addEventListener('click', (event) => {
  const canvas = document.querySelector('canvas')
  const { top, left } = canvas.getBoundingClientRect()
  const player = frontEndPlayers[socket.id]

  if (!player || !player.target) return

  // Calculate angle based on TARGET position (server-authoritative)
  const angle = Math.atan2(
    event.clientY - top - player.target.y,
    event.clientX - left - player.target.x
  )

  // Client-side prediction with server-aligned position
  const tempId = `prediction-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 5)}`
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5
  }

  frontEndProjectiles[tempId] = new Projectile({
    x: player.target.x, // Use server's target position
    y: player.target.y,
    radius: 5,
    color: player.color,
    velocity
  })

  socket.emit('shoot', { angle, tempId })
})
