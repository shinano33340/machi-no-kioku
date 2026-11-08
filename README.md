# まちの記憶

世界の国・都市と、日本の都道府県・市区町村を日本語で探す地域図鑑です。
静的HTML/CSS/JavaScriptで動作し、ビルドは不要です。

## 機能

- Wikipediaの候補検索と地域記事の取得。完全一致なら直接表示、同名・部分一致は候補選択。
- 歴史節の段落、箇条書き、見出しを取得し、先頭の西暦・世紀を読み取れる記述を年代順に整理。年表には抜粋元の段落をそのまま掲載。歴史節の本文は省略件数の上限を設けず、年表下の「歴史本文をすべて読む」から開けます。年代を判別できない資料は掲載順で表示し、その旨を明示します。
- 現在の基本情報タブ。Wikidataに登録があれば国、行政区分、首都、公用語、通貨、人口（基準年付き）を表示。人口はリアルタイム値ではありません。
- Googleマップを16:9で埋め込み。拡大・移動、史跡の選択、地域全体への復帰、外部Googleマップと経路へのリンク。代替地図には同梱LeafletとOpenStreetMapを使用。地図は現在の地図であり、古地図・歴史上の国境ではありません。
- 公式サイトとSNSを地域ごとに切り替え。ローマ観光局のFacebook、Instagram、X、YouTube、LinkedInは2026年11月7日に公式サイトの掲載リンクを確認。一般の検索結果はWikidata掲載情報を利用し、その出典へリンク。未登録のSNSは別の都市から流用しません。
- ローマ・長野市の編集済み概説と史跡を同梱。それ以外の都市は代表座標の10km周辺からWikipediaにある歴史・文化に関する施設を最大8件取得。国全体や資料のない場所はGoogleマップの史跡検索へ案内します。全国・世界の全文化財を網羅するものではありません。
- ローマにはイベント、散策コース、旅程、子ども向け、無料・低価格、食文化の公式案内リンクを掲載。日時・料金はリンク先で確認します。
- お気に入りと文字サイズは端末のlocalStorageへ保存。スマートフォンは1列、パソコンは歴史と地図を2列に表示。

## 結果が混在しないための構成

`#place` 内に歴史、基本情報、SNS、地図、史跡、関連情報をまとめています。
新しい検索・読み込み・候補選択時には前の結果全体を隠して地図のsrcと外部リンクを解除します。
データの取得が完了してから同期的に結果全体を描画し、最後に表示します。
非同期処理は操作番号で照合するため、古い検索・補足情報の遅延応答は新しい選択を上書きしません。
外部の本文はHTMLを挿入せず、`textContent`で表示します。本文の高さに上限を設けません。

## 都市・資料を追加する

`dist/places.js` の `placeExtras` に1件追加します。既存の `rome`・`nagano` は基本記事を補完し、新しいキーには以下のように記事全体を定義できます。

```js
example: {
  title: '地域名', roman: 'English name',
  crumb: '国 / 都道府県 / 市区町村',
  subtitle: '短い紹介', lat: 0, lon: 0,
  overview: '基本情報の説明', intro: '歴史の導入文',
  events: [['1900年', '出来事の見出し', '説明']], // 古い順に登録
  facts: [['国', '国名'], ['行政区分', '都道府県名']],
  sources: [['資料の名称', 'https://example.org/source']],
  note: '確認日と資料の説明',
  official: 'https://example.org/',
  socialSource: 'https://example.org/social-policy',
  social: [['Facebook', 'https://www.facebook.com/確認したID']],
  landmarks: [{title:'史跡名',period:'時代',text:'説明',query:'史跡名 地域名',source:'https://example.org/history'}],
  eventPlaces: {'出来事の見出し':1}, // 関連するlandmarksの番号（1から）
  explore: [['散策', '説明', 'https://example.org/walk']]
}
```

`lat` / `lon` は実際の代表座標へ置き換えてください。史跡にも座標を入れると代替地図でも地点を表示できます。座標の代わりの `query` はGoogleマップの地名検索に使います。
追加した地域は名前・英語名で直接検索できます。公式SNSは公式サイトから確認したリンクを登録します。

## ファイルと検証

- `dist/index.html`: ページ構造
- `dist/app.js`: 検索・状態・歴史本文
- `dist/features.js`: 年代整理、Wikidata、史跡、地図・関連情報
- `dist/places.js`: 編集済み地域データ
- `dist/style.css`: レスポンシブ表示
- `dist/map.html`, `dist/map.js`, `dist/vendor/leaflet`: 代替地図
- `tests/app.test.cjs`: 結果の全体更新、通信失敗、検索競合、補足情報の競合、年代順の回帰テスト

検証: `node --test tests/app.test.cjs`
`dist/` を静的ホストで配信します。`.openai/hosting.json` に既存SiteのIDを保持しています。
必要な接続先: ja.wikipedia.org, www.wikidata.org, www.google.com, tile.openstreetmap.org, fonts.googleapis.com, fonts.gstatic.com。
Wikipedia本文の著作権とライセンスは各元記事に従います。CC BY-SAのリンクを画面に表示しています。LeafletのLICENSEは同梱フォルダー内を参照してください。
