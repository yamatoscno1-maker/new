const puppeteer = require('puppeteer');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const ACCOUNTS = JSON.parse(process.env.MYFANS_ACCOUNTS);
const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({ credential: cert(SERVICE_ACCOUNT) });
const db = getFirestore();

function currentTab() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${mm}-${now.getFullYear()}`;
}

async function fetchAccountSales(browser, account) {
  const page = await browser.newPage();
  try {
    console.log(`[${account.name}] Logging in...`);
    await page.goto('https://myfans.jp/login', { waitUntil: 'networkidle2', timeout: 30000 });

    await page.type('input[type="email"]', account.email, { delay: 30 });
    await page.type('input[type="password"]', account.password, { delay: 30 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    const tab = currentTab();
    let allItems = [];
    let pageNum = 1;
    const PER_PAGE = 50;

    while (true) {
      const apiData = [];

      // APIレスポンスを傍受
      const handler = async (res) => {
        const url = res.url();
        if (url.includes('sales') && res.request().method() === 'GET') {
          try {
            const json = await res.json();
            const items = json.data ?? json.sales ?? (Array.isArray(json) ? json : null);
            if (items) apiData.push(...items);
          } catch (_) {}
        }
      };
      page.on('response', handler);

      const url = `https://myfans.jp/account/sales?tab=${tab}&page=${pageNum}&per_page=${PER_PAGE}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
      page.off('response', handler);

      if (apiData.length > 0) {
        allItems.push(...apiData);
        console.log(`[${account.name}] Page ${pageNum}: ${apiData.length} records`);
        if (apiData.length < PER_PAGE) break;
      } else {
        // DOM フォールバック
        const total = await page.evaluate(() => {
          const el = document.querySelector('[class*="total"], [class*="amount"]');
          return el ? el.innerText : null;
        });
        console.log(`[${account.name}] DOM total: ${total}`);
        break;
      }

      pageNum++;
      if (pageNum > 20) break;
    }

    // Firestore に保存
    const docId = `${account.name}_${tab}`;
    await db.collection('myfans_sales').doc(docId).set({
      accountName: account.name,
      tab,
      fetchedAt: new Date().toISOString(),
      count: allItems.length,
      items: allItems,
    });

    console.log(`[${account.name}] Saved ${allItems.length} records.`);
    return allItems;
  } catch (err) {
    console.error(`[${account.name}] Error:`, err.message);
    return [];
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const account of ACCOUNTS) {
      await fetchAccountSales(browser, account);
      await new Promise(r => setTimeout(r, 3000)); // アカウント間に待機
    }
  } finally {
    await browser.close();
  }

  console.log('All accounts done.');
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
