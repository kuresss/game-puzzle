#version 300 es
precision highp float;

uniform sampler2D u_target;
uniform vec2 u_point;
uniform vec2 u_velocity;
uniform vec4 u_color;   // .rg = pH, temp; .b = unused; .a = density
uniform float u_radius;
uniform float u_aspectRatio;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 p = v_uv - u_point;
  p.x *= u_aspectRatio;
  float splat = exp(-dot(p, p) / u_radius);
  vec4 base = texture(u_target, v_uv);
  fragColor = base + vec4(u_velocity * splat, 0.0, 0.0);
}
