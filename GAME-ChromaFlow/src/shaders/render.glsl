#version 300 es
precision highp float;

uniform sampler2D u_dye;
uniform sampler2D u_target;
uniform float u_targetAlpha;  // 目標画像のオーバーレイ透明度 (0=非表示, 0.3=うっすら表示)

in vec2 v_uv;
out vec4 fragColor;

vec3 phTempToColor(float pH, float temp) {
  // pH: 0=酸性(赤系), 1=塩基(青系)
  // 酸性側: 赤→オレンジ
  vec3 acidColor = mix(vec3(0.90, 0.20, 0.10), vec3(0.95, 0.55, 0.05), clamp(pH * 2.0, 0.0, 1.0));
  // 塩基側: 青→紫
  vec3 baseColor = mix(vec3(0.10, 0.45, 0.95), vec3(0.55, 0.10, 0.90), clamp((pH - 0.5) * 2.0, 0.0, 1.0));
  vec3 hueColor = pH < 0.5 ? acidColor : baseColor;
  // 温度: 輝度と彩度を変調
  float brightness = 0.55 + temp * 0.55;
  float saturation = 0.65 + temp * 0.40;
  vec3 gray = vec3(dot(hueColor, vec3(0.299, 0.587, 0.114)));
  return mix(gray, hueColor * brightness, saturation);
}

void main() {
  vec4 dye = texture(u_dye, v_uv);
  float pH     = dye.r;
  float temp   = dye.g;
  float density = dye.a;

  vec3 color = phTempToColor(pH, temp);
  vec3 bg = vec3(0.05, 0.05, 0.08);
  vec3 fluid = mix(bg, color, clamp(density * 2.5, 0.0, 1.0));

  // お題画像のオーバーレイ（うっすら表示）
  if (u_targetAlpha > 0.0) {
    vec4 target = texture(u_target, v_uv);
    fluid = mix(fluid, target.rgb, u_targetAlpha * target.a);
  }

  fragColor = vec4(fluid, 1.0);
}
