import { chromium } from 'playwright';
import path from 'path';

const storageStatePath = path.join(__dirname, '.auth/storageState.json');

const COMMUTE_DAYS = process.env.COMMUTE_DAYS?.split(',').map(Number) || [];
const DEP = process.env.DEP || '';
const DEST = process.env.DEST || '';
const AMOUNT = parseInt(process.env.AMOUNT || '0', 10);

(async () => {
  const today = new Date();
  const todayYear: number = today.getFullYear();
  const todayMonth: number = today.getMonth() + 1;
  const targetYear: number = process.argv[2] ? parseInt(process.argv[2], 10) : todayYear;
  const targetMonth: number = process.argv[3] ? parseInt(process.argv[3], 10) : todayMonth;
  const days = getDaysOfWeek(targetYear, targetMonth, COMMUTE_DAYS);

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: storageStatePath,
  });
  const page = await context.newPage();

  // 事前にログインしておくこと
  await page.goto('https://ssl.wf.jobcan.jp/');

  // 雛形作成
  await page.locator('a').filter({ hasText: '申請する' }).click();
  await page.getByRole('heading', { name: '経費・精算 経費精算（交通費）' }).click();
  await page.getByPlaceholder('出発地を入力').click();
  await page.waitForTimeout(200);
  await page.getByRole('textbox', { name: '利用日を入力' }).click();
  await page.getByRole('link', { name: '17' }).click();
  await page.getByPlaceholder('出発駅名を入力（前方一致）').first().fill(DEP);
  await page.getByPlaceholder('到着駅名を入力（前方一致）').first().fill(DEST);
  await page.getByRole('button', { name: '金額は手入力する' }).click();
  await page.getByRole('combobox').selectOption('number:1');

  // 対象月の明細行を作成
  await page.locator('.action-icon > .fa').first().click();
  for (let i = 0; i < days.length - 2; i++) {
    await page.locator('span').filter({ hasText: '明細行をコピー' }).first().locator('i').click();
  }
  for (let i = 0; i < days.length; i++) {
    // 利用日
    await page.getByRole('textbox', { name: '利用日を入力' }).nth(i).click();
    // 年
    if (targetYear != todayYear) {
      await page.getByRole('link', { name: '▾' }).click();
      await page.getByRole('link', { name: targetYear.toString() }).click();
    }
    // 月
    if (targetMonth != todayMonth) {
      for(let j = 0; j < Math.abs(targetMonth - todayMonth); j++) {
        if (targetMonth > todayMonth) await page.getByRole('link', { name: '⟩' }).first().click();
        if (targetMonth < todayMonth) await page.getByRole('link', { name: '⟨' }).first().click();
      }
    }
    // 前後月の日付がvalueとしては重複している。当月は"ng-repeat="item in days"プロパティを持つ。
    await page.locator('a[ng-repeat="item in days"]').filter({ hasText: days[i].toString() }).first().click();
    await page.getByRole('button', { name: '金額は手入力する' }).click();
    await page.waitForTimeout(200);
    await page.getByPlaceholder('金額を入力').nth(i).fill(AMOUNT.toString());
    console.log('Day ' + days[i] + ' is set.');
    await page.waitForTimeout(200);
  }

  // 終了処理
  await context.storageState({ path: storageStatePath });
  console.log('Done.');
})();

function getDaysOfWeek(year: number, month: number, daysOfWeek: number[]): number[] {
  const result: number[] = [];
  const daysInMonth = new Date(year, month, 0).getDate(); // 月の最終日を取得

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day)); // 月を0ベースに
    const dayOfWeek = date.getUTCDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
    if (daysOfWeek.includes(dayOfWeek)) {
      result.push(day);
    }
  }

  return result;
}


