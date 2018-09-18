#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform float u_width;
uniform float u_height;
uniform float u_threshold;

uniform sampler2D u_tex0;

float getGrey(vec4 c) {
  vec4 onethird;
  vec4 cc;
  float sum;
  onethird = vec4 (0.333333,0.333333,0.333333,0);
  cc = c;
  sum = dot(onethird, cc);
  return sum;
}

void main() {
  float K00 = -1.0;
  float K01 = -2.0;
  float K02 = -1.0;
  float K10 = 0.0;
  float K11 = 0.0;
  float K12 = 0.0;
  float K20 = 1.0;
  float K21 = 2.0;
  float K22 = 1.0;

  vec2 ox = vec2 (0.0,0.0);
  ox[0] = u_width;
  vec2 oy = vec2 (0.0,0.0);
  oy[1] = u_height;

  float g00, g01, g02;
  float g10, g11, g12;
  float g20, g21, g22;
  vec4 CC;

  vec2 PP = v_texcoord - oy;
  CC = texture2D(u_tex0, vec2(PP-ox));
  g00 = getGrey(CC);
  CC = texture2D(u_tex0, vec2(PP));
  g01 = getGrey(CC);
  CC = texture2D(u_tex0, vec2(PP+ox));
  g02 = getGrey(CC);


  PP = v_texcoord;
  CC = texture2D(u_tex0, vec2(PP-ox));
  g10 = getGrey(CC);
  CC = texture2D(u_tex0, vec2(PP));
  g11 = getGrey(CC);
  CC = texture2D(u_tex0, vec2(PP+ox));
  g12 = getGrey(CC);

  PP = v_texcoord + oy;
  CC = texture2D(u_tex0, vec2(PP-ox));
  g20 = getGrey(CC);
  CC = texture2D(u_tex0, vec2(PP));
  g21 = getGrey(CC);
  CC = texture2D(u_tex0, vec2(PP+ox));
  g22 = getGrey(CC);

  float sx = 0.0, sy = 0.0;
  sx = sx + g00 * K00;
  sx = sx + g01 * K01;
  sx = sx + g02 * K02;
  sx = sx + g10 * K10;
  sx = sx + g11 * K11;
  sx = sx + g12 * K12;
  sx = sx + g20 * K20;
  sx = sx + g21 * K21;
  sx = sx + g22 * K22;
  sy = sy + g00 * K00;
  sy = sy + g01 * K10;
  sy = sy + g02 * K20;
  sy = sy + g10 * K01;
  sy = sy + g11 * K11;
  sy = sy + g12 * K21;
  sy = sy + g20 * K02;
  sy = sy + g21 * K12;
  sy = sy + g22 * K22;

  float dist = sqrt(sx * sx + sy * sy);

  gl_FragColor = dist > u_threshold ? vec4(0.,0.,0.,1.) : vec4(1.,1.,1.,1.);
}
