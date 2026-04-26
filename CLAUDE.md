# Money Dash — プロジェクト構成ガイド

静的HTMLサイト（GitHub Pages）。バニラJS + 共通CSS。ビルドステップなし。

## ツール一覧

| ファイル名 | ツール名 | 備考 |
|---|---|---|
| `index.html` | ポータル（ツール一覧） | JSなし |
| `fire-calculator.html/.js` | FIREシミュレーター | |
| `dividend-portfolio.html/.js` | 配当ポートフォリオ計算機 | |
| `mortgage-vs-rent.html/.js` | 住宅ローンvs賃貸 | **Tailwind CSS使用**（他と異なる） |
| `montecarlo.html/.js` | モンテカルロFIREシミュレーター | |
| `insurance-needed.html/.js` | 必要保障額シミュレーター | affiliateが独自デザイン |
| `ideco.html/.js` | iDeCo節税シミュレーター | |
| `lifeevent-fire.html/.js` | ライフイベント込みFIREシミュレーター | **affiliateなし** |
| `nisa.html/.js` | 新NISA運用シミュレーター | |
| `rebalance.html/.js` | 資産リバランス計算機 | |

共通: `common.css`

## 各HTMLの基本構造

```html
<head>
  <!-- GA → Chart.js → common.css → <style>（ツール固有CSS）-->
</head>
<body>
  <nav class="site-nav">...</nav>          <!-- body直下、containerの外 -->
  <div class="container">
    <!-- ツール本体 -->
    <div class="affiliate-section">...</div> <!-- containerの中・末尾 -->
  </div>
  <script src="toolname.js"></script>
  <div class="related-tools-wrap" style="max-width:Npx;">
    <div class="related-tools-inner">
      <p class="related-tools-title">関連ツール</p>
      <div class="related-tools-grid">
        <a href="..." class="related-tool-card">
          <span class="related-tool-icon">emoji</span>
          <div>
            <div class="related-tool-name">名前</div>
            <div class="related-tool-desc">説明</div>
          </div>
        </a>
      </div>
    </div>
    <p class="disclaimer">...</p>
  </div>
</body>
```

`related-tools-wrap` の `max-width` はcontainerに合わせる:
- 1200px: lifeevent-fire
- 1000px: fire-calculator, insurance-needed, ideco, nisa, index
- 900px: montecarlo, rebalance
- 800px: dividend-portfolio
- mortgage-vs-rent は Tailwind のため独自構造

## common.css クラス一覧

### ナビ
`.site-nav` `.nav-logo` `.nav-sep` `.nav-current`

### アフィリエイト
`.affiliate-section` `.affiliate-label` `.affiliate-title`
`.affiliate-buttons` `.affiliate-btn` `.affiliate-btn-sbi` `.affiliate-btn-rakuten` `.affiliate-note`

### 関連ツール
`.related-tools-wrap` `.related-tools-inner` `.related-tools-title`
`.related-tools-grid` `.related-tool-card` `.related-tool-icon` `.related-tool-name` `.related-tool-desc`

### その他
`.disclaimer`

## アフィリエイトURLプレースホルダー

現在ダミーURL。審査通過後に一括置換する:
- `#AFFILIATE_URL_SBI` → SBI証券アフィリエイトURL
- `#AFFILIATE_URL_RAKUTEN` → 楽天証券アフィリエイトURL

対象ファイル: fire-calculator, dividend-portfolio, mortgage-vs-rent, montecarlo, insurance-needed, ideco, nisa, rebalance（各2箇所）

## インフラ

- GitHub Pages（静的、無料）
- Cloudflare DNS + HTTPS（money-dash.com）
- Chart.js 4.5.1 CDN + SRI固定
- Google Analytics G-4P1NTQCQPX
