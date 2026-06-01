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

  // 一覧から「工数入力が可能な日（下線付き＝出勤あり）」を収集する
  // NOTE: 一覧のセルは textDecoration: underline かつ cursor: pointer で表現される
  const editableDays: number[] = [];
  for (const day of days) {
    const mmdd = targetMonth.toString().padStart(2, '0') + '/' + day.toString().padStart(2, '0');
    const cell = page1.getByRole('cell', { name: mmdd, exact: true }).first();
    const canClick = await cell
      .evaluate(node => window.getComputedStyle(node).textDecoration.includes('underline'))
      .catch(() => false);
    if (canClick) {
      editableDays.push(day);
    } else {
      console.log('Day ' + day + ' is not editable. (skip)');
    }
  }

  // 各日の編集ページへ直接遷移して工数を設定する
  // NOTE: 2026-05-28 のジョブカン更新で保存がAJAX化し、保存後も一覧へ戻らなくなった。
  //       そのため一覧からの遷移に依存せず、編集URLへ直接アクセスする。
  for (const day of editableDays) {
    const editUrl =
      'https://ssl.jobcan.jp/employee/man-hour-manage/edit-achievement' +
      `?year=${targetYear}&month=${targetMonth}&day=${day}&aid=`;
    await page1.goto(editUrl);
    await page1.waitForSelector('#add_default_manhour');

    // 既存の工数行があれば全選択して削除
    await page1.locator('#select_all').check();
    await page1.waitForTimeout(300); // checkしても削除がactivateされるまで待つ
    if (await page1.locator('#remove').isEnabled()) {
      await page1.locator('#remove').click();
    }

    // デフォルト工数を追加して保存（保存はAJAXのためページ遷移しない）
    await page1.locator('#add_default_manhour').click();
    await page1.locator('#save').click();
    await page1.waitForTimeout(1000); // 保存完了を待つ
    console.log('Day ' + day + ' is set.');
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


