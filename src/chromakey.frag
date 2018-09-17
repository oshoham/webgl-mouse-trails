#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform sampler2D u_tex0;
uniform sampler2D u_tex1;

uniform vec4 u_color;
uniform float u_tol;
uniform float u_fade;
uniform float u_invert;

void main() {
  vec4 one_third = vec4(0.333333);

  vec4 a = texture2D(u_tex0, v_texcoord);
  vec4 b = texture2D(u_tex1, v_texcoord);
  vec4 source = a;
  vec4 target = u_color;

  // zero our alphas
  source.a = 0.;
  target.a = 0.;	

  // measure distance from target
  vec4 vdelta = abs(source-target);

  // sum vector distance, scaling by a third
  float delta = dot(vdelta,one_third); 

  // determine scaling coefficient witin our fade range
  float scale = smoothstep(abs(u_tol),abs(u_tol)+abs(u_fade),delta);

  // invert if necessary
  float mixamount = mix(scale,1.-scale,u_invert);

  // blend between sources based on mixamount	
  vec4 result = mix(b,a,vec4(mixamount));

  // result either blend or mask based on mode
  gl_FragColor = result;
}
