const canvas = document.getElementById('regl-canvas')
const regl = require('regl')()
const resl = require('resl')
const mouse = require('mouse-change')()

const fragmentShader = require('./main.frag')
const chromakeyShader = require('./chromakey.frag')
const chromakey2Shader = require('./chromakey2.frag')
const lumadisplaceShader = require('./lumadisplace.frag')
const edgedetectShader = require('./edgedetect.frag')
const fadeShader= require('./fade.frag')
const drawCursorShader = require('./draw-mouse.frag')
const accumShader = require('./accum.frag')
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


const width = regl._gl.canvas.width
const height = regl._gl.canvas.height
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

const currentFrame = createBuffer()
const feedbackBuffers = Array(2).fill(0).map(createBuffer)
const displaceBuffer = createBuffer()
const edgeBuffer = createBuffer()
const fadeBuffer = createBuffer()

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
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [
      drawingBufferWidth,
      drawingBufferHeight
    ],
    u_mouse_image_dimensions: [cursorWidth, cursorHeight],
    u_mouse: ({ boundingRect, drawingBufferWidth, drawingBufferHeight }) => {
      let mouseX
      if (mouse.x <= boundingRect.left) {
        mouseX = 0
      } else if (mouse.x > boundingRect.right) {
        mouseX = drawingBufferWidth
      } else {
        mouseX = mouse.x - boundingRect.left
      }

      let mouseY
      if (mouse.y >= boundingRect.bottom) {
        mouseY = 0
      } else if (mouse.y < boundingRect.top) {
        mouseY = drawingBufferHeight
      } else {
        mouseY = drawingBufferHeight - (mouse.y - boundingRect.top)
      }

      return [mouseX, mouseY]
    },
    u_tex0: regl.prop('tex0'),
  },
  framebuffer: regl.prop('framebuffer')
})

const accum = regl({
   frag: accumShader,
   vert: vertexShader,
   uniforms: {
     u_erase_color: regl.prop('eraseColor'),
     u_tex0: regl.prop('tex0'),
     u_tex1: regl.prop('tex1')
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

const chromakey2 = regl({
  frag: chromakey2Shader,
  vert: vertexShader,
  uniforms: {
    u_color: regl.prop('color'),
    u_tolerance: regl.prop('tol'),
    u_fade: regl.prop('fade'),
    u_minkey: regl.prop('minkey'),
    u_maxkey: regl.prop('maxkey'),
    u_foreground: regl.prop('tex0'),
    u_background: regl.prop('tex1')
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
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [
      drawingBufferWidth,
      drawingBufferHeight
    ],
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
        framebuffer: currentFrame
      })

      edgedetect({
        tex0: currentFrame,
        framebuffer: edgeBuffer
      })

      // accum({
      //   eraseColor: [1.0, 1.0, 1.0, 0.6],
      //   tex0: currentFrame,
      //   tex1: feedbackBuffers[tick % 2],
      //   framebuffer: feedbackBuffers[(tick + 1) % 2]
      // })

      chromakey({
        color: Array(3).fill(0.0).concat(1.0),
        tol: 0.3,
        fade: 0.0,
        invert: 1.0,
        tex0: edgeBuffer,
        tex1: feedbackBuffers[tick % 2],
        framebuffer: feedbackBuffers[(tick + 1) % 2]
      })

      // chromakey2({
      //   color: [0.0, 0.0, 0.0, 1.0],
      //   tol: 0.3,
      //   fade: 0.1,
      //   minkey: 0.0,
      //   maxkey: 1.,
      //   tex0: currentFrame,
      //   tex1: feedbackBuffers[tick % 2],
      //   framebuffer: feedbackBuffers[(tick + 1) % 2]
      // })

      lumadisplace({
        amp: [0.0, 0.005],
        offset: [0, 0.01],
        tex0: feedbackBuffers[(tick + 1) % 2],
        framebuffer: displaceBuffer
      })

      fade({
        fade: 0.9,
        tex0: displaceBuffer,
        framebuffer: fadeBuffer
      })

      drawTexture({
        tex0: fadeBuffer,
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