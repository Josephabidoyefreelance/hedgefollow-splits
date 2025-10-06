import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 10000;
const FINNHUB_KEY = process.env.FINNHUB_KEY;

app.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];

    const response = await axios.get('https://finnhub.io/api/v1/calendar/split', {
      params: { from: today, to: tomorrow, token: FINNHUB_KEY }
    });

    // Use optional chaining and default empty array
    const rawSplits = response.data?.data || [];

    const splits = rawSplits.map(item => ({
      ticker: item.symbol,
      exchange: item.exchange,
      company: item.symbol, // can later map to full name
      ratio: item.ratio,
      exDate: item.exDate,
      announcementDate: item.announcementDate
    }));

    res.json({ success: true, count: splits.length, data: splits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
