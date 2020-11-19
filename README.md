# d-anime-save-annict-2

You can install from [Chrome Store URL](https://chrome.google.com/webstore/detail/danime-save-annict-2/kclfdffcicdnmfjaiikclpoldoojfnpj?hl=ja)

## Abstaract
This Chrome extension sends your watching record in [d-anime store](https://anime.dmkt-sp.jp/animestore/tp_pc) to [Annict](https://annict.jp/).
Forked from [kakunpc's Repository](https://github.com/kakunpc/danime-save-annict).

----

dアニメストアの視聴結果をAnnictに送るChrome拡張です。[kakunpcさんのRepository](https://github.com/kakunpc/danime-save-annict)からforkした改良版です。

多くの作品に対応できるようにしましたが、まだまだ漏れはあると思います。気が付いたことがあれば、連絡してもらえると幸いです。

なお現在の仕様上、劇場版のように1つの話を複数に分割している作品や、逆に短編アニメで複数話を1つにまとめている作品は未対応です。

## improvements about features

### 表記ゆれの対応
同一の作品でもdアニメストアとAnnictでは表記が異なることがあり、さまざまな対応が必要でした。各項目では適宜例を示しています。

- 英数字や一部の記号を全角から半角に統一するようにした。
    - 数年前からdアニメストアではタイトルに含まれる英数字や一部の記号(`:`など)を全角で表記するようになった。(`ダイヤのＡ‐ＳＥＣＯＮＤ ＳＥＡＳＯＮ‐`)  
      例外もあるが、半角に統一しているので問題はない。(`Re:ゼロから始める異世界生活`)
    - Annictでは半角で統一されているが、全角のままのものもある。(`ご注文はうさぎですか？？ ～Sing For You～`)
- 追加の変換を行うようにした。
    - ローマ数字はdアニメストアでは環境依存記号で表記され、Annictでは`II`のようにアルファベットで代用されている。(`ダイヤのA actⅡ`)
    - `〈`と`＜`のように、一部記号を変換する必要がある。(`〈物語〉シリーズ セカンドシーズン`)
    - dアニメストア側にのみついている鍵括弧を削除する。(`｢DAYS｣`, `『つばさタイガー 其ノ貳』`)
    - 話数の部分では漢数字をアラビア数字に置き換える。(`第拾九話`)
- `Title（第1話～第50話）`のような配信サイト故の表記について調整した。(`遊☆戯☆王SEVENS　マキシマム編`, `〈物語〉シリーズ セカンドシーズン（第1話～第5話） 猫物語(白)`)
    - オリジナルバージョンではdアニメストア側のタイトルがAnnict側のタイトルにすべて含まれるかを確認していたが、全体的にAnnict側の方がシンプルな場合が多いので、含まれる方向の判断を反対にした。(Annict側の`遊☆戯☆王SEVENS`はdアニメストア側の`遊☆戯☆王SEVENS　マキシマム編`に含まれる。)
    - 上記変更に伴い、タイトルの比較は、完全一致かどうかではなく部分一致の長さが最長のタイトルを**一致したタイトル**とした。~~(`ひぐらしのなく頃に解`は`ひぐらしのなく頃に`も含むが、一致長が最も長いのは`ひぐらしのなく頃に解`)~~

### その他

- Annictに視聴履歴を送るタイミングを「動画終了時・動画スキップ時」から「動画終了時・動画再生開始5分後」にした。
    - 動画視聴をやめるためにブラウザを閉じるとAnnictに送信されない点を改善した。
    - 送信のタイミングが動画再生開始5分後なので、すぐに動画を終了した場合やスキップした場合にはAnnictに送信されない。これによりAnnictの視聴履歴にノイズが残らない。

## improvements about scripts

- 各変数の宣言を`var`から`const/let`に置き換えて、より安全なscriptにした。
- 非同期処理を`async/await`に統一することでscriptの見通しをよくした。
- この拡張機能の使い方ではあまり必要性がなかったので、`graphql-fetch`を採用せず通常の`fetch`を利用した。
- 漢数字をアラビア数字に変換する機能は[aok.blue.coocan.jp](http://aok.blue.coocan.jp/jscript/kan2arb.html)に掲載されていた関数を整えて利用した。
- あまり意味のない変数を減らしてscriptをコンパクトにした。

## Reference

- [kakunpc / danime-save-annict](https://github.com/kakunpc/danime-save-annict)
- [aok.blue.coocan.jp / kan2arb](http://aok.blue.coocan.jp/jscript/kan2arb.html)

## License
MIT

