#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

// uniform vec2 size;
uniform vec2 u_amp;
uniform vec2 u_offset;
uniform sampler2D u_tex0;

void main() {
  // vec4 tex_color = texture2D(u_tex0, v_texcoord);
  // vec4 l = tex_color * vec4(0.299, 0.587, 0.114, 0.0);

  // gl_FragColor = texture2D(u_tex0, v_texcoord + size * vec2(l.r + l.g + l.b + l.a));

  vec4 pixel = texture2D(u_tex0, v_texcoord);
  float brightness = length(pixel.rgb);

  vec2 displacement = (vec2(brightness) + u_offset) * u_amp;

  gl_FragColor = texture2D(u_tex0, v_texcoord + displacement);
}
