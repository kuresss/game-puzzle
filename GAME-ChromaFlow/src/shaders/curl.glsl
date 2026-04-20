#version 300 es
precision highp float;

uniform sampler2D u_velocity;
uniform vec2 u_texelSize;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float L = texture(u_velocity, v_uv - vec2(u_texelSize.x, 0.0)).y;
  float R = texture(u_velocity, v_uv + vec2(u_texelSize.x, 0.0)).y;
  float T = texture(u_velocity, v_uv + vec2(0.0, u_texelSize.y)).x;
  float B = texture(u_velocity, v_uv - vec2(0.0, u_texelSize.y)).x;
  float curl = R - L - T + B;
  fragColor = vec4(curl, 0.0, 0.0, 1.0);
}
