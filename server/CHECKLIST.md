# サーバー動作確認チェックリスト（手動）

上から順にやれば、全エンドポイント・全ガードを確実に検証できます。
各項目の **操作**（やること）と **期待**（こうなれば OK）を確認しながら `[ ]` → `[x]` で潰してください。

- **おすすめの進め方**: ブラウザで **Swagger UI**（http://localhost:4000/api/docs）を開き、各エンドポイントの `Try it out` → `Execute` で実行。レスポンスとステータスコードがその場で見えます。
- curl 派の人向けに同じ操作の curl も併記しています。先に `export API=http://localhost:4000/api` をしておくと楽です。
- ID が必要な手順は、先に `GET /tree` を実行して対象の `id` をコピーして使ってください。

---

## 0. 事前準備

- [ ] **サーバー起動**
  - 操作: `cd server && npm run dev`
  - 期待: `🗂 Pseudo-FS API listening on http://localhost:4000` が表示される
- [ ] **クリーンな初期データから始めたい場合（任意）**
  - 操作: 一度サーバーを止め、`rm -f prisma/dev.db prisma/dev.db-journal && npx prisma migrate deploy && npm run seed`、再度 `npm run dev`
  - 期待: `Seed complete.` が出て、ツリーが初期状態（Documents / Pictures / Projects / readme.txt）に戻る

---

## 1. 正常系（ハッピーパス）

- [ ] **1-1 ヘルスチェック**
  - 操作: ブラウザで http://localhost:4000/api/health ／ `curl $API/health`
  - 期待: `200` ・ `{"status":"ok","service":"pseudo-fs-server"}`

- [ ] **1-2 ツリー全体取得**
  - 操作: ブラウザで http://localhost:4000/api/tree ／ `curl $API/tree`
  - 期待: `200` ・ root の下に `Documents / Pictures / Projects / readme.txt`。フォルダが先・ファイルが後の順。各ファイルに `isBinary` `mimeType` `size` `rawUrl` が付く

- [ ] **1-3 ノード1件取得（パンくず + children）**
  - 操作: `GET /nodes/{id}` に `root` を指定 ／ `curl $API/nodes/root`
  - 期待: `200` ・ `data.path`（パンくず配列）と `data.children`（直下の一覧）が返る

- [ ] **1-4 フォルダ作成**
  - 操作: `POST /nodes` body `{"name":"Music","type":"FOLDER","parentId":"root"}`
  - curl: `curl -X POST $API/nodes -H 'Content-Type: application/json' -d '{"name":"Music","type":"FOLDER","parentId":"root"}'`
  - 期待: `201` ・ `data.id` が採番される（**この id を 1-5 以降で使う** → `MUSIC_ID` とメモ）

- [ ] **1-5 テキストファイル作成**
  - 操作: `POST /nodes` body `{"name":"song.txt","type":"FILE","parentId":"<MUSIC_ID>","content":"la la la"}`
  - 期待: `201` ・ `isBinary:false` ・ `content:"la la la"` ・ `size` が文字数ぶん（この id を `SONG_ID` とメモ）

- [ ] **1-6 リネーム＋内容編集**
  - 操作: `PATCH /nodes/{SONG_ID}` body `{"name":"ballad.txt","content":"new lyrics"}`
  - 期待: `200` ・ `name` が `ballad.txt`、`content` が更新、`size` と `updatedAt` も変わる

- [ ] **1-7 移動（Music → root）**
  - 操作: `POST /nodes/{SONG_ID}/move` body `{"parentId":"root"}`
  - 期待: `200` ・ `parentId` が `root` になる

- [ ] **1-8 検索**
  - 操作: `GET /search?q=todo` ／ `curl "$API/search?q=todo"`
  - 期待: `200` ・ `todo.md` がヒットし、`pathString:"/Documents/todo.md"` が付く・`count` が件数

- [ ] **1-9 削除（フォルダ）**
  - 操作: `DELETE /nodes/{MUSIC_ID}`
  - 期待: `200` ・ `{"data":{"id":"...","deleted":true}}`

---

## 2. バイナリ（画像・PDF）

- [ ] **2-1 PNG アップロード**
  - 操作: `POST /nodes/upload`（multipart, フィールド `file` に画像、`parentId=root`）
  - curl: `curl -X POST $API/nodes/upload -F 'file=@/path/to/any.png;type=image/png' -F 'parentId=root'`
  - 期待: `201` ・ `isBinary:true` ・ `mimeType:"image/png"` ・ `size` が実バイト数（この id を `IMG_ID` とメモ）

- [ ] **2-2 画像が表示できる（/raw）**
  - 操作: ブラウザで http://localhost:4000/api/nodes/`<IMG_ID>`/raw を開く
  - 期待: 画像がそのまま表示される（`Content-Type: image/png` で返っている）

- [ ] **2-3 ツリーに画像のバイト列が混ざっていない**
  - 操作: `GET /tree` をもう一度見る
  - 期待: アップした画像が一覧に出るが、巨大な `data`（バイト列）は **含まれない**（`rawUrl` だけ）。一覧が重くならない設計の確認

- [ ] **2-4 PDF も同様に通る（任意）**
  - 操作: `POST /nodes/upload` に PDF を添付（`type=application/pdf`）→ その `/raw` をブラウザで開く
  - 期待: `mimeType:"application/pdf"`、ブラウザで PDF が表示される

---

## 3. 異常系・ガード（ここが“確実”の肝）

> 期待ステータスが返り、`{"error":...,"message":...}` 形式で理由が返ることを確認します。

- [ ] **3-1 名前の重複** → `POST /nodes` で既存名 `{"name":"Documents","type":"FOLDER","parentId":"root"}`
  - 期待: `409`（`... already exists in this folder`）
- [ ] **3-2 入力不正（type 欠落）** → `POST /nodes` body `{"name":"x"}`
  - 期待: `400` ・ `error:"ValidationError"` ・ `details` に `type is Required`
- [ ] **3-3 名前に `/`** → `POST /nodes` body `{"name":"a/b","type":"FILE"}`
  - 期待: `400`（`name cannot contain "/"`）
- [ ] **3-4 親がファイル** → `readme.txt` の id を `parentId` にして作成
  - 期待: `400`（`Node is not a folder`）
- [ ] **3-5 存在しないノード取得** → `GET /nodes/does-not-exist`
  - 期待: `404`
- [ ] **3-6 root 削除** → `DELETE /nodes/root`
  - 期待: `400`（`Cannot delete the root folder`）
- [ ] **3-7 root 移動** → `POST /nodes/root/move` body `{"parentId":"root"}`
  - 期待: `400`
- [ ] **3-8 自分自身へ移動** → 任意フォルダを自分の id に move
  - 期待: `400`（`Cannot move a node into itself`）
- [ ] **3-9 子孫へ移動（循環）** → 親フォルダを、その子フォルダの中へ move
  - 期待: `400`（`Cannot move a folder into one of its own descendants`）
- [ ] **3-10 バイナリをテキスト編集** → 画像ノードに `PATCH {"content":"x"}`
  - 期待: `400`（`Cannot edit a binary file as text`）
- [ ] **3-11 アップロードの名前重複** → 既存名で `POST /nodes/upload`
  - 期待: `409`
- [ ] **3-12 ファイル未添付アップロード** → `file` を付けずに `POST /nodes/upload`
  - 期待: `400`（`No file uploaded ...`）
- [ ] **3-13 サイズ上限（10MB 超）**
  - 準備: `dd if=/dev/zero of=/tmp/big.bin bs=1m count=11`（約11MB）
  - 操作: `curl -X POST $API/nodes/upload -F 'file=@/tmp/big.bin' -F 'parentId=root'`
  - 期待: `413`（`File too large`）
- [ ] **3-14 存在しないルート** → `GET /api/nope`
  - 期待: `404` ・ `error:"NotFound"`

---

## 4. ドキュメント（Swagger / OpenAPI）

- [ ] **4-1 Swagger UI** → ブラウザで http://localhost:4000/api/docs
  - 期待: 全エンドポイントが一覧表示され、`Try it out` が使える
- [ ] **4-2 OpenAPI JSON** → http://localhost:4000/api/openapi.json
  - 期待: `openapi: "3.0.3"` の JSON が返る（フロント/ツールに渡せる）

---

## 5. 後片付け（任意）

- [ ] **テストで作ったノードを消して初期状態に戻す**
  - 操作: サーバーを止め、`rm -f prisma/dev.db prisma/dev.db-journal && npx prisma migrate deploy && npm run seed`
  - 期待: `Seed complete.` ・ ツリーが初期状態に戻る

---

### 全部 `[x]` になれば、サーバー側は正常系・バイナリ・ガード・ドキュメントまで確認完了です。
