#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform sampler2D u_tex0;
uniform sampler2D u_tex1;

// accum amount
uniform vec4 u_erase_color;

// entry point
void main()
{      
	vec4 current = texture2D(u_tex0, v_texcoord);
	vec4 previous = texture2D(u_tex1, v_texcoord);

	vec4 framebuffer = mix(previous, u_erase_color, u_erase_color.a);

	gl_FragColor = framebuffer + current;
}