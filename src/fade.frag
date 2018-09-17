#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform float u_fade;
uniform sampler2D u_tex0;

void main() {
  gl_FragColor = texture2D(u_tex0, v_texcoord) + u_fade * 0.005;
}