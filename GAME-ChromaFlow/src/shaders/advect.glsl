#version 300 es
precision highp float;

uniform sampler2D u_velocity;
uniform sampler2D u_source;
uniform float u_dt;
uniform vec2 u_texelSize;
uniform float u_dissipation;

in vec2 v_uv;
out vec4 fragColor;

vec4 bilerp(sampler2D tex, vec2 uv) {
  vec2 st = uv / u_texelSize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture(tex, (iuv + vec2(0.5, 0.5)) * u_texelSize);
  vec4 b = texture(tex, (iuv + vec2(1.5, 0.5)) * u_texelSize);
  vec4 c = texture(tex, (iuv + vec2(0.5, 1.5)) * u_texelSize);
  vec4 d = texture(tex, (iuv + vec2(1.5, 1.5)) * u_texelSize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main() {
  vec2 vel = texture(u_velocity, v_uv).xy;
  vec2 prevUV = v_uv - vel * u_dt * u_texelSize;
  fragColor = u_dissipation * bilerp(u_source, prevUV);
}
