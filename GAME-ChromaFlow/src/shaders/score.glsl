#version 300 es
precision highp float;

uniform sampler2D u_current;
uniform sampler2D u_target;
uniform vec2 u_texelSize;

in vec2 v_uv;
out vec4 fragColor;

// pH/temp空間でのMSE計算
// 各ピクセルでの差をRチャンネルに出力し、外部でreduction
void main() {
  vec4 cur = texture(u_current, v_uv);
  vec4 tgt = texture(u_target, v_uv);

  // 現在の流体をphTempToColorで色に変換（renderと同じ変換）
  // 簡易的にdensity加重でpH/tempを比較
  float curDensity = cur.a;
  float tgtDensity = tgt.a;

  float dPH   = cur.r - tgt.r;
  float dTemp = cur.g - tgt.g;
  float dDens = curDensity - tgtDensity;

  // 密度差を重要視: 密度がある領域ではpH/tempも考慮
  float score = dPH * dPH + dTemp * dTemp + dDens * dDens * 2.0;
  fragColor = vec4(score, 0.0, 0.0, 1.0);
}
