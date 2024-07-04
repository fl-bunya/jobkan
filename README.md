## これはなに
ジョブカンの自動入力スクリプト。

## 使い方

注意：コマンド例はbunです。nodeでやる人は.envを読むようにしてください。

### .envを用意する（初回）
.env.exampleを参考に、適宜書き換える。

### ログインする（セッションがなければ）
```
bun ./playwright/login.ts
```
Googleで2FA認証する。  
ログインできたら、cmd+cで終了。  
  
セッションがstorageState.jsonに保存される。  
セッションが有効な内は、再ログインする必要はない。  

### 交通費の明細を作る
```
bun ./playwright/commutation.ts
```

当月以外の明細を作る場合は、年月を引数に渡す。
```
bun ./playwright/commutation.ts 2025 8
```
明細ができたら、そのまま下書き保存や申請などをする。  
cmd+cで終了。  

<div style="background-color: #ffcc00; padding: 10px; border-radius: 5px; color: #000000; ">
  ⚠️ 祝日などは反映されないので、手動で修正する必要がある。
</div>
