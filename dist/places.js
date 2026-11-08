'use strict';
// Add curated cities here. Fields are independent of the presentation code.
const placeExtras = {
  rome: {
    eventPlaces: {'共和国、そして帝国の中心へ':1},
    facts: [['区分','イタリアの首都'],['国','イタリア'],['地域','ラツィオ州'],['主な言語','イタリア語'],['通貨','ユーロ']],
    official: 'https://www.turismoroma.it/en',
    socialSource: 'https://www.turismoroma.it/en',
    social: [['LinkedIn','https://www.linkedin.com/company/turismoroma'],['Instagram','https://instagram.com/turismoromaweb'],['Facebook','https://www.facebook.com/tourismrome/'],['X','https://x.com/Turismoromaweb'],['YouTube','https://www.youtube.com/user/turismoroma/']],
    landmarks: [
      {title:'コロッセオ',period:'古代ローマ',text:'古代の円形闘技場。帝国時代の都市と人々の暮らしに思いをめぐらせる場所です。',query:'Colosseo Roma Italia',source:'https://www.turismoroma.it/en/page/city'},
      {title:'フォロ・ロマーノ',period:'古代ローマ',text:'政治や宗教の中心だった広場の遺跡。コロッセオとともに古代の街をたどれます。',query:'Foro Romano Roma Italia',source:'https://www.turismoroma.it/en/page/city'},
      {title:'ローマ歴史地区',period:'古代から近代へ',text:'幾つもの時代の建築が重なる世界遺産。現在の地図で位置関係を確かめられます。',query:'Centro Storico Roma Italia',source:'https://whc.unesco.org/en/list/91/'}
    ],
    explore: [
      ['イベント','展覧会・音楽・街の催し','https://www.turismoroma.it/en/romalive'],
      ['散策コース','テーマから見つけるローマの歩き方','https://www.turismoroma.it/en/tipo-itinerari/themed-itineraries'],
      ['旅程','48時間・72時間の旅の参考に','https://www.turismoroma.it/en/taxonomy/term/67'],
      ['子どもと楽しむ','家族向けの観光情報','https://www.turismoroma.it/en/page/things-do-kids-rome'],
      ['無料・低価格','公式観光局で最新条件を確認','https://www.turismoroma.it/en/taxonomy/term/243'],
      ['食文化','ローマの伝統料理を知る','https://www.turismoroma.it/en/page/traditional-cuisine']
    ]
  },
  nagano: {
    eventPlaces: {'門前町と城下町の発展':1},
    facts: [['区分','長野県の県庁所在地'],['国','日本'],['都道府県','長野県'],['主な言語','日本語'],['通貨','日本円']],
    official:'https://www.city.nagano.nagano.jp/',
    landmarks:[
      {title:'善光寺',period:'門前町の歴史',text:'参拝者を迎える門前町の発展と深い関わりを持つ寺院です。',query:'善光寺 長野市',source:'https://www.zenkoji.jp/'},
      {title:'松代城跡',period:'城下町の歴史',text:'松代の城下町を知る手がかりとなる城跡。門前町とは異なる地域の歩みをたどれます。',query:'松代城跡 長野市',source:'https://www.city.nagano.nagano.jp/'}
    ],
    explore:[['観光と散策','善光寺・松代などの旅の情報','https://www.nagano-cvb.or.jp/'],['市の情報','長野市の公式情報を確認','https://www.city.nagano.nagano.jp/'],['歴史資料','長野市デジタルミュージアム','https://adeac.jp/nagano-city/']]
  }
};
