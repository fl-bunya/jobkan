import { chromium } from 'playwright';
import path from 'path';

const storageStatePath = path.join(__dirname, '.auth/storageState.json');

(async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://ssl.wf.jobcan.jp/');
  await page.goto('https://id.jobcan.jp/users/sign_in?app_key=wf');
  await page.getByLabel('ログイン情報を保存する').check();
  await page.getByRole('link', { name: 'google Googleでログイン' }).click();
  await page.getByLabel('メールアドレスまたは電話番号').click();
  await page.getByLabel('メールアドレスまたは電話番号').fill(process.env.EMAIL || '');
  await page.waitForTimeout(3000); // ここで待たないとbot扱いで400エラーになりがち
  await page.getByLabel('メールアドレスまたは電話番号').press('Enter');
  await page.getByLabel('パスワードを入力').fill(process.env.PASSWORD || '');
  await page.getByRole('button', { name: '次へ' }).click();
  await page.getByLabel('電話番号').fill(process.env.TEL || '');
  await page.getByRole('button', { name: '送信' }).click();

  // 2FAコード入力画面の読み込みを待つ
  await page.waitForSelector('input[type="tel"]');
  console.log('2FAコードを入力してください...');

  // 経費のログイン
  await page.waitForURL('https://ssl.wf.jobcan.jp/#/', { timeout: 600000 });
  await context.storageState({ path: storageStatePath });

  // 勤怠のログイン
  await page.getByRole('link', { name: '勤怠' }).click();
  await context.storageState({ path: storageStatePath });

  console.log('ログイン完了');

  await context.close();
  await browser.close();
})();
