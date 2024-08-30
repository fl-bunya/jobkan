## これはなに
ジョブカンの自動入力スクリプト。

## 使い方

bunをinstallしておく  
https://bun.sh/docs/installation
> ⚠️ nodeでやる人は.envを読む修正が必要かもしれない。  

リポジトリをクローン。
```
git clone git@github.com:fl-bunya/jobkan.git
```

playwrightをいれる。色々聞かれるがエンター連打。
```
bun create playwright
```

### .envを用意する（初回）
.env.exampleを参考に、適当な値に書き換える。

### ログインする（セッションがなければ）
```
bun ./playwright/login.ts
```
Googleで2FA認証する。  
ログインできたら、cmd+cで終了。  
  
セッションがstorageState.jsonに保存される。  
セッションが有効な内は、再ログインする必要はない。  

### 交通費の明細を入力する

> ⚠️
> .envで設定した出社曜日の明細が作られる。  
> 祝日やイレギュラーな出社は反映されない。要手動修正。

```
bun ./playwright/commutation.ts
```

当月以外の明細を作る場合は、年月を引数に渡す。
```
bun ./playwright/commutation.ts 2025 8
```
コンソールで`Done`が表示されたら終了。
明細ができたら、そのまま下書き保存や申請などをする。  
cmd+cで終了。

### 工数実績を入力する

事前に、ジョブカン上でデフォルト工数を設定しておく。  
工数管理 > 工数入力設定 > デフォルト  
`(999)全商品`と`実績100%`を設定しておく。

> ⚠️
> 実行前に打刻漏れがないか確認。  
> また、実行によって、対象月全日の既存の入力工数は削除される。  
> デフォルト工数で上書きする。  

```
bun ./playwright/manHour.ts
```

当月以外は、年月を渡す。
```
bun ./playwright/manHour.ts 2025 8
```
コンソールで`Done`が表示されたら終了。
cmd+cで終了。
