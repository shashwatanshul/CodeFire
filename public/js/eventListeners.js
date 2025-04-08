addEventListener('click', (event) => {
  const canvas = document.querySelector('canvas')
  const { top, left } = canvas.getBoundingClientRect()
  const player = frontEndPlayers[socket.id]

  if (!player || !player.target) return

  // Use server-authoritative target position for angle calculation
  const angle = Math.atan2(
    event.clientY - top - player.target.y,
    event.clientX - left - player.target.x
  )

  // Client-side prediction for immediate feedback
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5
  }

  const tempProjectileId = `temp-${Date.now()}`
  frontEndProjectiles[tempProjectileId] = new Projectile({
    x: player.target.x,
    y: player.target.y,
    radius: 5,
    color: player.color,
    velocity
  })

  // Emit to server
  socket.emit('shoot', { angle, tempProjectileId })
})
