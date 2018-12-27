<template>
  <div class="game-container">
    <div class="canvas-container">
      <canvas ref="canvas" tabindex="1"></canvas>
      <div class="overlay" v-show="!this.isPlaying">
        <b-button variant="primary" @click="start">Start</b-button>
      </div>
    </div>
  </div>
</template>

<script>

const mapWidth = 64 // in sprites
const mapHeight = 24 // in sprites
const spriteSize = 10
const spritePadding = 2

class Sprite {
  constructor(context, position = { x: 0, y: 0 }, width = 1, height = 1, velocity = { x: 0, y: 0 }, color = 'white') {
    this.position = position
    this.velocity = velocity
    this.context = context
    this.isDrawn = false

    this.height = height
    this.width = width

    this.color = color
  }

  update() {
    this.clear()
    this.move()
    this.draw()
  }

  move() {
    if (this.velocity.y > 0) {
      if (this.position.y < mapHeight - this.height) {
        this.position.y += this.velocity.y
      }
      if (this.position.y === mapHeight - this.height) {
        this.velocity.y *= -1
      }

    } else {
      if (this.position.y > 0) {
        this.position.y += this.velocity.y
      }
      if (this.position.y === 0) {
        this.velocity.y *= -1
      }
    }

    if (this.velocity.x > 0) {
      if (this.position.x < mapWidth - this.width) {
        this.position.x += this.velocity.x
      }
      if (this.position.x === mapWidth - this.width) {
        this.velocity.x *= -1
      }

    } else {
      if (this.position.x > 0) {
        this.position.x += this.velocity.x
      }
      if (this.position.x === 0) {
        this.velocity.x *= -1
      }
    }
  }

  draw() {
    this.isDrawn = true
    this.context.fillStyle = this.color || 'white'
    this.context.fillRect(
      this.position.x * spriteSize + spritePadding,
      this.position.y * spriteSize + spritePadding,
      this.width * spriteSize - (spritePadding * 2),
      this.height * spriteSize - (spritePadding * 2)
    )
  }

  clear() {
    this.isDrawn = false
    this.context.clearRect(
      this.position.x * spriteSize + spritePadding,
      this.position.y * spriteSize + spritePadding,
      this.width * spriteSize - (spritePadding * 2),
      this.height * spriteSize - (spritePadding * 2)
    )
  }
}

export default {
  name: 'WaitingGame',

  data() {
    return {
      isPlaying: false,

      blocks: [],
      sprites: [],
      player: null,
    }
  },

  mounted() {
    this.context = this.$refs.canvas.getContext('2d')

    this.$refs.canvas.setAttribute('width', mapWidth * spriteSize)
    this.$refs.canvas.setAttribute('height', mapHeight * spriteSize)
    this.$refs.canvas.parentElement.style.width = `${mapWidth * spriteSize}px`
    this.$refs.canvas.parentElement.style.height = `${mapHeight * spriteSize}px`

    this.player = new Sprite(this.context, { x: 0, y: 0 }, 1, 4)
    this.ball = new Sprite(this.context, { x: 1, y: 2 }, 1, 1, { x: 1, y: 1 })

    this.blocks = []

    for (let columnIndex = 0; columnIndex < Math.floor(mapWidth / 3); columnIndex++) {
      const row = []
      for (let rowIndex = 0; rowIndex < mapHeight; rowIndex++) {
        row[rowIndex] = new Sprite(this.context, { x: mapWidth - columnIndex, y: rowIndex })
        row[rowIndex].draw()
      }
      this.blocks.push(row)
    }

    this.ball.draw()
    this.player.draw()

  },

  methods: {
    start() {
      this.loop()
      this.isPlaying = true
      this.$refs.canvas.focus()
      this.$refs.canvas.addEventListener('keydown', this.onKeydown)
    },
    stop() {
      clearTimeout(this.timeoutId)
      this.$refs.canvas.removeEventListener('keydown', this.onKeydown)
    },
    onKeydown(event) {
      switch(event.key) {
        case 'ArrowUp':
          this.clear(this.player)
          this.player.position.y -= 1
          break

        case 'ArrowDown':
          this.clear(this.player)
          this.player.position.y += 1
          break
      }

      if (this.player.position.y < 0) this.player.position.y = 0
      if (this.player.position.y > mapHeight - this.player.height) this.player.position.y = mapHeight - this.player.height

      this.player.draw()

    },
    clear(sprite) {
      sprite.clear()
    },
    loop() {
      this.ball.update()
      this.timeoutId = setTimeout(() => { this.loop() }, 100)
    },
  },
}
</script>

<style lang="stylus" scoped>

  .game-container
    width: 100%
    display: flex
    justify-content: center

    .canvas-container
      position: relative

    canvas
      outline: 1px solid white

    .overlay
      top: 0
      left: 0
      width: 100%
      height: 100%
      position: absolute
      background-color: rgba(white, .25)

      display: flex
      align-items: center
      justify-content: center

</style>
