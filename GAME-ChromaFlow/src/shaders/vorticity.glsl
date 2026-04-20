#version 300 es
precision highp float;

uniform sampler2D u_velocity;
uniform sampler2D u_curl;
uniform vec2 u_texelSize;
uniform float u_curl_strength;
uniform float u_dt;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float L = abs(texture(u_curl, v_uv - vec2(u_texelSize.x, 0.0)).r);
  float R = abs(texture(u_curl, v_uv + vec2(u_texelSize.x, 0.0)).r);
  float T = abs(texture(u_curl, v_uv + vec2(0.0, u_texelSize.y)).r);
  float B = abs(texture(u_curl, v_uv - vec2(0.0, u_texelSize.y)).r);
  float C = texture(u_curl, v_uv).r;

  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= u_curl_strength * C;
  force.y *= -1.0;

  vec2 vel = texture(u_velocity, v_uv).xy;
  fragColor = vec4(vel + force * u_dt, 0.0, 1.0);
}
