// addEventListener('click', (event) => {
//   const canvas = document.querySelector('canvas')
//   const { top, left } = canvas.getBoundingClientRect()
//   const playerPosition = {
//     x: frontEndPlayers[socket.id].x,
//     y: frontEndPlayers[socket.id].y
//   }

//   const angle = Math.atan2(
//     event.clientY - top - playerPosition.y,
//     event.clientX - left - playerPosition.x
//   )

//   // const velocity = {
//   //   x: Math.cos(angle) * 5,
//   //   y: Math.sin(angle) * 5
//   // }

//   socket.emit('shoot', {
//     x: playerPosition.x,
//     y: playerPosition.y,
//     angle
//   })
//   // frontEndProjectiles.push(
//   //   new Projectile({
//   //     x: playerPosition.x,
//   //     y: playerPosition.y,
//   //     radius: 5,
//   //     color: 'white',
//   //     velocity
//   //   })
//   // )

//   console.log(frontEndProjectiles)
// })

addEventListener('click', (event) => {
  const canvas = document.querySelector('canvas')
  const { top, left } = canvas.getBoundingClientRect()
  const playerPosition = {
    x: frontEndPlayers[socket.id].x,
    y: frontEndPlayers[socket.id].y
  }

  // Calculate the angle to the mouse click
  const angle = Math.atan2(
    event.clientY - top - playerPosition.y,
    event.clientX - left - playerPosition.x
  )

  // 1) Create a local projectile immediately (client-side prediction)
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5
  }

  // Create a unique local ID so we can store this projectile in our object
  const localProjectileId = `local_${Date.now()}_${Math.random()}`

  frontEndProjectiles[localProjectileId] = new Projectile({
    x: playerPosition.x,
    y: playerPosition.y,
    radius: 5,
    color: frontEndPlayers[socket.id].color,
    velocity
  })

  // 2) Let the server know we fired a shot
  socket.emit('shoot', {
    x: playerPosition.x,
    y: playerPosition.y,
    angle
  })

  console.log(frontEndProjectiles)
})
