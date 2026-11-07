# まちの記憶

世界の国と都市の歴史を日本語で読み、地図で確かめるレスポンシブなWebアプリ。ビルド不要の静的HTML/CSS/JavaScriptで構成。

- 検索語と記事名が一致すると、その場所を直接表示。候補選択・読み込み・エラー時には前の場所を隠し、説明と地図が混在しないようにする。
- Wikipediaの検索候補・概要・歴史節を公開APIから取得。記事の記述を抜粋し出典を表示。独自のAI要約は行わない。
- 代表座標の周辺地図をOpenStreetMapで表示。国境や行政区域の再現ではない。
- 公式のGoogle Maps URLsを利用し、アプリ内地図と同じ緯度・経度で場所と経路を開く。座標がない場合だけ地名検索へ移動。Googleアカウントの保存先・履歴とは同期しない。
- ローマと長野市の入門記事を同梱。参照資料は各記事内に明記。
- お気に入りと文字サイズはlocalStorageに端末ごとに保存。
- Webアプリマニフェストを付属。全機能はオンライン前提で、オフライン用サービスワーカーは設けていない。

`dist/` を静的ホストで配信する。外部依存：ja.wikipedia.org, www.wikidata.org, tile.openstreetmap.org, www.google.com, fonts.googleapis.com, fonts.gstatic.com。Leaflet 1.9.4のJS/CSSは `dist/vendor/leaflet/` に同梱（同フォルダのLICENSE参照）。地図画像の取得に失敗した場合は再読み込みボタンを表示。座標を持たない古いお気に入りは記事を再取得する。

地域名以外のWikipedia記事も候補に含まれる。歴史節や代表座標がない記事はその旨を表示し、元記事やGoogleマップへ案内する。Wikipedia本文は元記事の編集者による記述（CC BY-SA）。
