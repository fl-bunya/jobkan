import { chromium } from 'playwright';
import path from 'path';

const storageStatePath = path.join(__dirname, '.auth/storageState.json');

const COMMUTE_DAYS = [0,1,2,3,4,5,6];

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

  // NOTE: 事前にログインしておくこと
  await page.goto('https://ssl.wf.jobcan.jp/');

  // 一覧へ遷移
  await page.getByRole('link', { name: '勤怠' }).click();
  const page1Promise = page.waitForEvent('popup');
  const page1 = await page1Promise;
  await page1.getByRole('button', { name: '工数管理' }).click();
  await page1.getByRole('link', { name: '工数実績一覧' }).click();
  await page1.locator('#year').selectOption(targetYear.toString());
  await page1.locator('#month').selectOption(targetMonth.toString());
  await page1.getByRole('button', { name: '表示' }).click();

  // ダイアログが出たら常にOKを押す
  page1.on('dialog', dialog => {
    dialog.accept().catch(() => {});
  });

  // 一覧から各日へ遷移して工数を設定
  for (let i = 0; i < days.length; i++) {
    // await page.waitForTimeout(300);

    const mmdd = targetMonth.toString().padStart(2, '0') + '/' + days[i].toString().padStart(2, '0');
    const cell = page1.getByRole('cell', { name: mmdd });
    const canClick = await cell.evaluate(node => {
      const style = window.getComputedStyle(node);
      return style.textDecoration.includes('underline');
    });

    if (canClick) {
      await page1.getByRole('cell', { name: mmdd }).click();
      await page1.locator('#select_all').check();
      await page1.getByRole('button', { name: '削除' }).click();
      await page1.getByRole('button', { name: 'デフォルト工数を追加' }).click();
      await page1.getByRole('button', { name: '保存' }).click();
      console.log('Day ' + days[i] + ' is set.');
    } else {
      console.log('Day ' + days[i] + ' is not clickable.');
    }
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


