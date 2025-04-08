addEventListener('click', (event) => {
  const canvas = document.querySelector('canvas')
  const { top, left } = canvas.getBoundingClientRect()
  const player = frontEndPlayers[socket.id]

  if (!player || !player.target) return

  // Calculate angle based on server-authoritative position
  const angle = Math.atan2(
    event.clientY - top - player.target.y,
    event.clientX - left - player.target.x
  )

  // Generate temporary ID and create predictive projectile
  const tempProjectileId = `temp-${Date.now()}`
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5
  }

  frontEndProjectiles[tempProjectileId] = new Projectile({
    x: player.target.x,
    y: player.target.y,
    radius: 5,
    color: player.color,
    velocity
  })

  // Send shooting data to server
  socket.emit('shoot', {
    angle,
    tempProjectileId,
    x: player.target.x,
    y: player.target.y
  })
})
