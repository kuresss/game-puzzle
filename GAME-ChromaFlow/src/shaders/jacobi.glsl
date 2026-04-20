#version 300 es
precision highp float;

uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
uniform vec2 u_texelSize;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float L = texture(u_pressure, v_uv - vec2(u_texelSize.x, 0.0)).r;
  float R = texture(u_pressure, v_uv + vec2(u_texelSize.x, 0.0)).r;
  float T = texture(u_pressure, v_uv + vec2(0.0, u_texelSize.y)).r;
  float B = texture(u_pressure, v_uv - vec2(0.0, u_texelSize.y)).r;
  float div = texture(u_divergence, v_uv).r;
  fragColor = vec4((L + R + T + B - div) * 0.25, 0.0, 0.0, 1.0);
}
