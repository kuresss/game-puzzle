# GAME3-2048 ハーネス仕様書 v1（大サイクル1）

## ゲーム概要
4×4グリッドでタイルをスライドさせ、同じ数字を合体させて2048を目指すパズルゲーム。

## 使用スキル
| タスク | スキル |
|--------|--------|
| コア実装 | 小サイクル1-2 |
| UI実装 | 小サイクル3-4 |
| 統合・ハーネス | 小サイクル5 |

## アーキテクチャ
```
GAME3-2048/
├── src/
│   ├── gameCore.js      ← 純粋ゲームロジック
│   ├── storage.js       ← localStorage管理
│   └── gridView.js      ← ViewModel変換
├── test/
│   ├── gameCore.test.js
│   └── storage.test.js
├── scripts/
│   ├── build-web-assets.js
│   └── harness-check.js
├── script.js            ← UIエントリポイント
├── index.html
├── styles.css
└── package.json
```

## 小サイクル計画
| 小サイクル | 実装内容 | 完了基準 |
|-----------|----------|---------|
| 1 | gameCore.js + test/gameCore.test.js | 全テストPASS |
| 2 | storage.js + test/storage.test.js + gridView.js | 全テストPASS |
| 3 | index.html + styles.css | 目視確認 |
| 4 | script.js（ゲームループ+キー/スワイプ） | harness:check PASS |
| 5 | package.json + harness-check.js + .gitignore + git init | harness:check PASS |

## ゲームロジック仕様
- ボード: 4×4 = 16セル（平坦配列、0=空き）
- スポーン: 90%→2、10%→4、空きセルのランダム位置
- 移動方向: left / right / up / down
- マージルール: 同方向に滑らせて隣接する同値を合体（1手で同値を2回合体不可）
- スコア: マージした合計値を加算
- 勝利: 2048以上のタイルが出現
- 敗北: 空きセルなし かつ 合体可能な隣接セルなし
