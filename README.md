# かわいくデコれる手帳（Android版）

工程表・メモ・フリーコラージュを、シールや飾り枠でかわいくデコれる手帳アプリです🌸✨
ひとり用・完全オフライン。データはすべて端末の中だけに保存されます。

[pppzet/KawaiiDecoNote](https://github.com/pppzet/KawaiiDecoNote)（Web版オリジナル）を、Expo（React Native + TypeScript）でAndroidアプリに移植したものです。

## 機能

- **2種類の手帳**
  - **プロフィール帳式** — 最初からかわいい飾り枠つき。工程フローや自由帳ページを作れる
  - **ノート式** — 白紙のキャンバスに、テキスト・写真・シールを自由に配置してコラージュ
- **工程フロー** — 工程をチェックリストで並べる。完了するとシールが弾ける演出。**if分岐**（はい／いいえ）で条件分けもできる
- **フリーコラージュ** — テキストカード・写真・シールをドラッグ／拡大／回転で自由配置。カード同士を**つなぎ線**で結べる
- **シール** — 星・花・ハート・リボン・きらめきの5種類。好きな大きさ・角度で貼れる
- **飾り枠** — シンプル／オーロラ滲み／星屑ちらし／リボン留め
- **用紙** — ノート式は横罫・方眼・ドット・無地＋9色の用紙色
- **きらめき** — 画面いっぱいに星がまたたく環境演出のオン／オフ
- **画像で保存** — 盤面をPNGにして共有・保存（📸）
- **バックアップ** — JSON書き出し／読み込み。**Web版オリジナルのバックアップJSONもそのまま読み込めます**（写真も含めて相互互換）
- **元に戻す** — 直前の操作をひとつ戻す（最大15手）

## APKの入手

[Releases](../../releases) から最新の `KawaiiDecoNote-x.y.z.apk` をダウンロードして、Android端末でインストールしてください（「提供元不明のアプリ」の許可が必要な場合があります）。

## 💾 データの保存について（大事）

- 作った手帳・ページ・シール・写真は、**すべて端末内だけ**に保存されます（外部のサーバーには一切送られません）
- 写真もJSON内にそのまま埋め込んで保存するので、バックアップ1ファイルで丸ごと持ち運べます
- アプリをアンインストールするとデータは消えます。**大事な記録は下部ツールバーの「💾 書き出し」から、ときどきJSONファイルに書き出しておくことを強くおすすめします**
  - 書き出したJSONは「📂 読み込み」から復元できます（今のデータは上書きされるので注意）

## 開発

```bash
npm install
npm start            # Metro起動（Expo Go で読み取り）
npm run android      # Androidで起動（開発ビルド）
```

検証コマンド（CIと同じ）:

```bash
npm run typecheck    # tsc --noEmit（strict + 追加フラグ全部入り）
npm run lint         # oxlint（エージェント向けフォーマット）
npm run lint:strict  # 警告もエラー扱い
npm run format       # prettier --write
npm run format:check
```

アイコン・スプラッシュ画像の再生成:

```bash
npm run assets:generate
```

## 技術スタック

- **Expo SDK 54**（React Native 0.81 / React 19、New Architecture）＋ **expo-router**（ファイルベースルーティング）
- **TypeScript**（`strict` + `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` などの追加フラグ全部入り）
- **react-native-gesture-handler + react-native-reanimated** — ドラッグ／拡大／回転などのUIスレッドジェスチャー
- **react-native-svg** — シール・飾り枠・背景グラデーション・用紙パターンの描画
- **react-native-view-shot** — 盤面のPNG書き出し
- **expo-sqlite** — 手帳データ（1件のJSONドキュメント）を kv テーブルに保存
- **expo-image-picker / expo-image-manipulator** — 写真の取り込みと縮小
- **expo-document-picker / expo-sharing** — バックアップの読み込み・書き出し
- **zustand** — 状態管理（差分更新＋デバウンス保存＋undo）
- **Oxlint / Prettier** — エージェントフレンドリー設定（`.oxlintrc.json` / `.prettierrc.json`）
- フォント: [Yomogi](https://fonts.google.com/specimen/Yomogi)（見出し）／ [M PLUS Rounded 1c](https://fonts.google.com/specimen/M+PLUS+Rounded+1c)（本文）

```
src/
  app/            # expo-router（表紙一覧 / 手帳エディタ）
  components/     # UI部品（cover / board / flowchart / freeform / notebook / transform / ui）
  lib/            # データモデル・DB・保存・バックアップ・画像・撮影などのロジック
  state/          # zustandストア（手帳ドキュメント / UI一時状態）
scripts/          # アイコン生成・CI用署名設定
.github/workflows # CI と APKリリース
```

移植にあたっては [Expo公式スキル集](https://github.com/expo/skills)（project-structure / native-ui / router / animations）を参照しています。

## 📜 ライセンス

このリポジトリのコードは **MITライセンス** で公開しています（詳しくは `LICENSE` ファイルをご覧ください）。
オリジナルのWeb版は [pppzet/KawaiiDecoNote](https://github.com/pppzet/KawaiiDecoNote) です。
なお、アプリ内でユーザーが自分でアップロードする写真などの著作権には影響しません。
