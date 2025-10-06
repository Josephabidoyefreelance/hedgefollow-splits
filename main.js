import axios from 'axios';
import * as cheerio from 'cheerio';
import { google } from 'googleapis';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const SPREADSHEET_ID = '1b7sGAoaFkT_VxgM2NAZbnE5yCLI4ABsT7p2yot7ZF6U';
const SHEET_NAME = 'Pratham Kumar Automation';

async function pushSplits(splits) {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  if (splits.length === 0) return 'No new splits for tomorrow.';

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: splits },
  });

  return `✅ ${splits.length} splits pushed successfully!`;
}

async function getTomorrowSplits() {
  const url = 'https://hedgefollow.com/upcoming-stock-splits.php';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const splits = [];

  // Parse each row from the splits table
  $('table tbody tr').each((_, el) => {
    const tds = $(el).find('td');
    const ticker = $(tds[0]).text().trim();
    const exchange = $(tds[1]).text().trim();
    const company = $(tds[2]).text().trim();
    const ratio = $(tds[3]).text().trim();
    const effectiveDate = $(tds[4]).text().trim();
    const announcementDate = $(tds[5]).text().trim();

    if (ticker && ratio && effectiveDate) {
      splits.push([ticker, exchange, company, ratio, effectiveDate, announcementDate]);
    }
  });

  // Optional: filter only tomorrow’s splits
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const filtered = splits.filter(s => s[4] === tomorrowStr);
  return filtered.length > 0 ? filtered : splits; // fallback if no exact matches
}

// 🟢 Root route
app.get('/', (req, res) => {
  res.send('🚀 HedgeFollow Splits Automation is live! Visit /scrape-splits to trigger the update.');
});

// 🧠 Scrape + Push route
app.get('/scrape-splits', async (req, res) => {
  try {
    const splits = await getTomorrowSplits();
    const result = await pushSplits(splits);
    res.send(result);
  } catch (err) {
    res.status(500).send('❌ Error: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
