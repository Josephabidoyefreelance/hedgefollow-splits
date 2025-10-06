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

    return '✅ Splits pushed successfully!';
}

function getTomorrowSplits() {
    return [
        ['AAPL', 'NASDAQ', 'Apple Inc.', '4:1', '2025-10-07', '2025-10-06'],
    ];
}

// 🟢 Root route to confirm the service is running
app.get('/', (req, res) => {
    res.send('🚀 HedgeFollow Splits Automation is live! Visit /scrape-splits to trigger the update.');
});

app.get('/scrape-splits', async (req, res) => {
    try {
        const splits = getTomorrowSplits();
        const result = await pushSplits(splits);
        res.send(result);
    } catch (err) {
        res.status(500).send('❌ Error: ' + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
