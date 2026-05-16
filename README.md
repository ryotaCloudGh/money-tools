# Money Dash — FIRE・資産運用 計算ツール集

FIRE・資産運用・住宅ローンなどのシミュレーターを集めた無料Webアプリ集。

**サイト:** https://money-dash.com

---

## ツール一覧

| ツール | URL |
|---|---|
| FIREシミュレーター | /fire-calculator.html |
| 配当ポートフォリオ計算機 | /dividend-portfolio.html |
| 住宅ローン vs 賃貸 | /mortgage-vs-rent.html |
| モンテカルロFIREシミュレーター | /montecarlo.html |
| 必要保障額シミュレーター | /insurance-needed.html |
| iDeCo節税シミュレーター | /ideco.html |
| ライフイベント込みFIREシミュレーター | /lifeevent-fire.html |
| 新NISA運用シミュレーター | /nisa.html |
| 資産リバランス計算機 | /rebalance.html |

---

## ファイル構成

```
/
├── index.html              # ポータル（ツール一覧）
├── fire-calculator.html    # 各ツールページ（URLはここに直接マップ）
├── *.html
├── privacy.html            # プライバシーポリシー
├── CNAME                   # カスタムドメイン設定
│
├── assets/
│   ├── common.css          # 全ツール共通スタイル
│   └── share.js            # X/LINEシェア機能
│
├── js/
│   ├── fire-calculator.js  # 各ツールのロジック
│   └── *.js
│
└── .github/
    ├── workflows/
    │   └── check-links.yml         # リンク切れ自動検知（毎週月曜）
    └── scripts/
        └── check_links.py          # リンクチェック本体
```

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| フロントエンド | 静的HTML + バニラJS（ビルドステップなし） |
| グラフ | Chart.js 4.5.1（CDN + SRI固定） |
| CSS（mortgage-vs-rentのみ） | Tailwind CSS 3.4.1（CDN） |
| ホスティング | GitHub Pages |
| DNS / HTTPS | Cloudflare |
| アクセス解析 | Google Analytics |

---

## ローカル開発

ビルド不要。任意のHTTPサーバーで動作確認できる。

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# VS Code
# Live Server 拡張機能でも可
```

http://localhost:8000 を開く。

---

## 新ツールの追加

1. `toolname.html` をrootに作成
2. `js/toolname.js` にロジックを記述
3. `assets/common.css` と `assets/share.js` を参照
4. `index.html` のツール一覧カードに追加
5. 全ツールの「関連ツール」セクションにリンク追加

詳細な実装パターンは既存ツールのHTMLを参照。

---

## 自動リンクチェック

`.github/workflows/check-links.yml` が毎週月曜 AM10:00 JST に自動実行。リンク切れを検知すると GitHub Issue を自動作成する。

---

## ライセンス

MIT
