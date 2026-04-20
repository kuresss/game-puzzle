#version 300 es
precision highp float;

uniform sampler2D u_target;
uniform vec2 u_point;
uniform vec4 u_color;   // .r=pH .g=temp .b=0 .a=density
uniform float u_radius;
uniform float u_aspectRatio;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 p = v_uv - u_point;
  p.x *= u_aspectRatio;
  float splat = exp(-dot(p, p) / u_radius);
  vec4 base = texture(u_target, v_uv);
  // 染料は加算ではなく weighted blend
  float newDensity = base.a + u_color.a * splat;
  float t = u_color.a * splat / max(newDensity, 0.0001);
  float newPH   = mix(base.r, u_color.r, t);
  float newTemp = mix(base.g, u_color.g, t);
  fragColor = vec4(newPH, newTemp, 0.0, clamp(newDensity, 0.0, 1.0));
}
