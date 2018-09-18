const canvas = document.getElementById('regl-canvas')
const regl = require('regl')()
const resl = require('resl')

let hasMouseMoved = false
const mouse = { x: 0, y: 0 }
const mouseChange = require('mouse-change')((buttonState, x, y) => {
  if (!hasMouseMoved) {
    hasMouseMoved = true
  }
  mouse.x = x
  mouse.y = y
})
const Hammer = require('hammerjs')
const hammer = new Hammer(regl._gl.canvas)
hammer.on('pan', (e) => {
  if (!hasMouseMoved) {
    hasMouseMoved = true
  }
  mouse.x = e.center.x
  mouse.y = e.center.y
})
regl._gl.canvas.addEventListener('touchend', (e) => {
  if (hasMouseMoved) {
    hasMouseMoved = false
  }
})

const fragmentShader = require('./main.frag')
const chromakeyShader = require('./chromakey.frag')
const lumadisplaceShader = require('./lumadisplace.frag')
const edgedetectShader = require('./edgedetect.frag')
const fadeShader= require('./fade.frag')
const drawCursorShader = require('./draw-mouse.frag')
const vertexShader = require('./main.vert')

const cursor = require('./osx-cursor.png')
const cursorWidth = 14;
const cursorHeight = 21;
const cursorStyle = document.createElement('style')
cursorStyle.type = 'text/css'
cursorStyle.innerHTML = `
  body {
    cursor: url(${cursor}), auto;
  }
`
document.body.appendChild(cursorStyle)


const fboScale = 0.75
const width = 2 * Math.round((regl._gl.canvas.clientWidth * fboScale) / 2)
const height = 2 * Math.round((regl._gl.canvas.clientHeight * fboScale) / 2)
const initialConditions = (Array(width * height * 4)).fill(1)

function createBuffer() {
  return regl.framebuffer({
    color: regl.texture({
      width: width,
      height: height,
      data: initialConditions
    }),
    depthStencil: false
  })
}

const edgeBuffer = createBuffer()
const feedbackBuffers = Array(2).fill(0).map(createBuffer)

const setupQuad = regl({
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  context: {
    boundingRect: () => document.body.getBoundingClientRect()
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles'
})

const drawCursor = regl({
  frag: drawCursorShader,
  vert: vertexShader,
  uniforms: {
    u_mouse_image_dimensions: ({ boundingRect }) => [
      cursorWidth / boundingRect.width,
      cursorHeight / boundingRect.height
    ],
    u_mouse: ({ boundingRect }) => {
      if (!hasMouseMoved) {
        return [-1, -1]
      }

      let mouseX
      if (mouse.x <= boundingRect.left) {
        mouseX = 0
      } else if (mouse.x > boundingRect.right) {
        mouseX = boundingRect.width
      } else {
        mouseX = mouse.x - boundingRect.left
      }

      let mouseY
      if (mouse.y >= boundingRect.bottom) {
        mouseY = 0
      } else if (mouse.y < boundingRect.top) {
        mouseY = boundingRect.height
      } else {
        mouseY = boundingRect.height - (mouse.y - boundingRect.top)
      }

      return [mouseX / boundingRect.width, mouseY / boundingRect.height]
    },
    u_tex0: regl.prop('tex0'),
  },
  framebuffer: regl.prop('framebuffer')
})

const chromakey = regl({
  frag: chromakeyShader,
  vert: vertexShader,
  uniforms: {
    u_color: regl.prop('color'),
    u_tol: regl.prop('tol'),
    u_fade: regl.prop('fade'),
    u_invert: regl.prop('invert'),
    u_tex0: regl.prop('tex0'),
    u_tex1: regl.prop('tex1')
  },
  framebuffer: regl.prop('framebuffer')
})

const lumadisplace = regl({
  frag: lumadisplaceShader,
  vert: vertexShader,
  uniforms: {
    u_amp: regl.prop('amp'),
    u_offset: regl.prop('offset'),
    u_tex0: regl.prop('tex0')
  },
  framebuffer: regl.prop('framebuffer')
})

const edgedetect = regl({
  frag: edgedetectShader,
  vert: vertexShader,
  uniforms: {
    u_width: regl.prop('width'),
    u_height: regl.prop('height'),
    u_threshold: regl.prop('threshold'),
    u_tex0: regl.prop('tex0')
  },
  framebuffer: regl.prop('framebuffer')
})

const fade = regl({
  frag: fadeShader,
  vert: vertexShader,
  uniforms: {
    u_fade: regl.prop('fade'),
    u_tex0: regl.prop('tex0')
  },
  framebuffer: regl.prop('framebuffer')
})

const drawTexture = regl({
  frag: fragmentShader,
  vert: vertexShader,
  uniforms: {
    u_tex0: regl.prop('tex0')
  },
  framebuffer: regl.prop('framebuffer')
})

const setup = cursorImage => {
  const cursorTexture = regl.texture(cursorImage)

  regl.frame(({ tick }) => {
    // do other stuff every frame

    // draw the shaders
    setupQuad(() => {
      drawCursor({
        tex0: cursorTexture,
        framebuffer: feedbackBuffers[(tick + 1) % 2]
      })

      edgedetect({
        width: 1.0 / width,
        height: 1.0 / height,
        threshold: 0.25,
        tex0: feedbackBuffers[(tick + 1) % 2],
        framebuffer: edgeBuffer
      })

      chromakey({
        color: Array(3).fill(0.0).concat(1.0),
        tol: 0.3,
        fade: 0.0,
        invert: 1.0,
        tex0: edgeBuffer,
        tex1: feedbackBuffers[tick % 2],
        framebuffer: feedbackBuffers[(tick + 1) % 2]
      })

      lumadisplace({
        amp: [0.0, 0.005],
        offset: [0, 0.01],
        tex0: feedbackBuffers[(tick + 1) % 2],
        framebuffer: feedbackBuffers[tick % 2],
      })

      fade({
        fade: 0.9,
        tex0: feedbackBuffers[tick % 2],
        framebuffer: feedbackBuffers[(tick + 1) % 2]
      })

      drawTexture({
        tex0: feedbackBuffers[(tick + 1) % 2]
      })
    })
  })
}

resl({
  manifest: {
    cursorImage: {
      type: 'image',
      src: cursor
    }
  },
  onDone: ({ cursorImage }) => setup(cursorImage)
})
