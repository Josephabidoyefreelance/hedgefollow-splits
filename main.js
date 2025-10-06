import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();

async function getTomorrowSplits() {
  const url = "https://www.hedgefollow.com/upcoming-stock-splits.php";

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    },
  });

  const $ = cheerio.load(data);
  const splits = [];

  $("table tbody tr").each((_, el) => {
    const tds = $(el).find("td");
    const ticker = $(tds[0]).text().trim();
    const exchange = $(tds[1]).text().trim();
    const company = $(tds[2]).text().trim();
    const ratio = $(tds[3]).text().trim();
    const effectiveDate = $(tds[4]).text().trim();
    const announcementDate = $(tds[5]).text().trim();

    if (ticker && ratio && effectiveDate) {
      splits.push([
        ticker,
        exchange,
        company,
        ratio,
        effectiveDate,
        announcementDate,
      ]);
    }
  });

  // Filter only tomorrow’s splits
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const filtered = splits.filter((s) => s[4] === tomorrowStr);
  return filtered.length > 0 ? filtered : splits;
}

// ✅ Root route so Render has something to respond to
app.get("/", async (req, res) => {
  try {
    const splits = await getTomorrowSplits();
    res.json({ success: true, count: splits.length, data: splits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Bind to Render’s port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
