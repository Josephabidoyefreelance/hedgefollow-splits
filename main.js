import fs from 'fs';
import { google } from 'googleapis';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const SPREADSHEET_ID = '1b7sGAoaFkT_VxgM2NAZbnE5yCLI4ABsT7p2yot7ZF6U';
const SHEET_NAME = 'Pratham Kumar Automation';
const SERVICE_ACCOUNT_FILE = 'service_account.json';

async function pushSplits(splits) {
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
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

    return '✅ Splits pushed successfully!';
}

// Replace this with your scraping logic from hedgefollow
function getTomorrowSplits() {
    // Example placeholder
    return [
        ['AAPL', 'NASDAQ', 'Apple Inc.', '4:1', '2025-10-07', '2025-10-06'],
    ];
}

app.get('/scrape-splits', async (req, res) => {
    try {
        const splits = getTomorrowSplits(); // dynamic scraping function
        const result = await pushSplits(splits);
        res.send(result);
    } catch (err) {
        res.status(500).send('❌ Error: ' + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
