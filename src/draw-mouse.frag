#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_mouse;
uniform vec2 u_mouse_image_dimensions;

uniform sampler2D u_tex0;

void main() {
  vec2 st = v_texcoord;

  st.y = 1.0 - st.y;

  st.x -= u_mouse.x;
  st.y += u_mouse.y - 1.0;

  st = st / u_mouse_image_dimensions;

  vec4 tex_color = texture2D(u_tex0, st);

  float box_thickness = 0.0001;
  // bottom-left
  vec2 bl = step(vec2(box_thickness), st);
  float pct = bl.x * bl.y;

  // top-right
  vec2 tr = step(vec2(box_thickness), 1.0 - st);
  pct *= tr.x * tr.y;

  vec4 bounding_box = vec4(vec3(pct), step(0.1, pct));

  gl_FragColor = tex_color * bounding_box;
}
