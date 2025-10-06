require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://hedgefollow.com/upcoming-stock-splits.php', { waitUntil: 'networkidle2' });

    console.log('Page loaded, scraping table...');

    const rows = await page.$$eval('table tr', trs =>
      trs
        .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()))
        .filter(cols => cols.length > 1)
    );

    const stocks = [];

    rows.forEach((cols, i) => {
      if (i === 0 || cols.length < 6) return; // skip header
      const exDate = new Date(cols[1]);
      exDate.setHours(0, 0, 0, 0);

      if (exDate.getTime() === tomorrow.getTime()) {
        stocks.push({
          Stock: cols[0] || '',
          CompanyName: cols[2] || '',
          SplitRatio: cols[3] || '',
          AnnouncementDate: cols[4] || '',
          Exchange: cols[5] || '',
          ExDate: cols[1] || ''
        });
      }
    });

    if (stocks.length > 0) {
      console.log(`Found ${stocks.length} splits for tomorrow. Sending to Zapier...`);
      await axios.post(WEBHOOK_URL, { splits: stocks });
      console.log('Data sent successfully.');
    } else {
      console.log('No splits for tomorrow.');
      await axios.post(WEBHOOK_URL, { splits: [] });
    }

    await browser.close();
  } catch (err) {
    console.error('Error:', err);
  }
})();
