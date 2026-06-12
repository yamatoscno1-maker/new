const puppeteer = require('puppeteer');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const EMAIL = process.env.MYFANS_EMAIL;
const PASSWORD = process.env.MYFANS_PASSWORD;
const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({ credential: cert(SERVICE_ACCOUNT) });
const db = getFirestore();

function currentTab() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${mm}-${now.getFullYear()}`;
}

async function fetchSales() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    // ---- Login ----
    console.log('Logging in...');
    await page.goto('https://myfans.jp/login', { waitUntil: 'networkidle2' });

    await page.type('input[type="email"], input[name="email"]', EMAIL, { delay: 50 });
    await page.type('input[type="password"], input[name="password"]', PASSWORD, { delay: 50 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    console.log('Logged in. Fetching sales...');

    // ---- Intercept API response ----
    const salesData = [];

    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes('/sales') && res.request().method() === 'GET') {
        try {
          const json = await res.json();
          if (json && (json.data || Array.isArray(json))) {
            const items = json.data || json;
            salesData.push(...items);
            console.log(`Captured ${items.length} records from API`);
          }
        } catch (_) {}
      }
    });

    const tab = currentTab();
    let allItems = [];
    let pageNum = 1;
    const PER_PAGE = 50;

    while (true) {
      const url = `https://myfans.jp/account/sales?tab=${tab}&page=${pageNum}&per_page=${PER_PAGE}`;
      salesData.length = 0;
      await page.goto(url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));

      if (salesData.length === 0) {
        // Fallback: try to scrape from DOM
        const domItems = await page.evaluate(() => {
          const rows = document.querySelectorAll('table tr, [class*="sale"], [class*="row"]');
          return Array.from(rows).map(r => r.innerText.trim()).filter(Boolean);
        });
        console.log(`DOM fallback: ${domItems.length} rows`);
        if (domItems.length <= 1) break; // header only or empty
        allItems.push(...domItems.map(text => ({ raw: text, page: pageNum })));
      } else {
        allItems.push(...salesData);
        if (salesData.length < PER_PAGE) break;
      }

      pageNum++;
      if (pageNum > 20) break; // safety
    }

    console.log(`Total records: ${allItems.length}`);

    // ---- Save to Firestore ----
    const docRef = db.collection('myfans_sales').doc(tab);
    await docRef.set({
      tab,
      fetchedAt: new Date().toISOString(),
      count: allItems.length,
      items: allItems,
    });

    console.log(`Saved to Firestore: myfans_sales/${tab}`);
    return allItems.length;
  } finally {
    await browser.close();
  }
}

fetchSales()
  .then(count => { console.log(`Done. ${count} records saved.`); process.exit(0); })
  .catch(err => { console.error('Error:', err); process.exit(1); });
