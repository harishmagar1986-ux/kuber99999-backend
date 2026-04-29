const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// OWNER SETTINGS
const OWNER_KEY = process.env.OWNER_KEY || "CHANGE_ME_SECRET";
let MODE = "PAPER";
let KILL_SWITCH = false;

// RISK SETTINGS
const MAX_TRADES_PER_DAY = 5;
const MAX_DAILY_LOSS = 2000;
let tradesToday = 0;
let dailyPnL = 0;
let ledger = [];
let lastSignal = "";

// TELEGRAM OPTIONAL
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

async function sendTelegram(message) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;

  try {
    await axios.post(
      "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage",
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      }
    );
  } catch (e) {
    console.log("Telegram error");
  }
}

// MARKET DATA - TEST MODE
async function getMarketPrice() {
  return 20000 + Math.floor(Math.random() * 500);
}

// STRATEGY ENGINE
function generateSignal(price) {
  let signal = "WAIT";
  let entry = "-";
  let sl = "-";
  let target = "-";
  let confidence = "50%";

  if (price > 20250) {
    signal = "BUY NIFTY CE";
    entry = price;
    sl = price - 50;
    target = price + 100;
    confidence = "80%";
  } else if (price < 20100) {
    signal = "SELL NIFTY PE";
    entry = price;
    sl = price + 50;
    target = price - 100;
    confidence = "75%";
  }

  return { signal, entry, sl, target, confidence };
}

// RISK CHECK
function riskCheck(data) {
  if (KILL_SWITCH) return { ...data, signal: "NO TRADE - KILL SWITCH" };
  if (data.confidence === "50%") return { ...data, signal: "NO TRADE" };
  if (tradesToday >= MAX_TRADES_PER_DAY) return { ...data, signal: "NO TRADE - DAILY LIMIT" };
  if (dailyPnL <= -MAX_DAILY_LOSS) return { ...data, signal: "NO TRADE - LOSS LOCK" };
  return data;
}

// PAPER EXECUTION
function recordTrade(data) {
  const trade = {
    id: Date.now(),
    signal: data.signal,
    entry: data.entry,
    sl: data.sl,
    target: data.target,
    confidence: data.confidence,
    mode: MODE,
    status: "PAPER OPEN",
    time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  };

  ledger.unshift(trade);
  if (ledger.length > 50) ledger.pop();

  tradesToday++;
  return trade;
}

async function executeTrade(data) {
  if (MODE === "PAPER") {
    return recordTrade(data);
  }

  // LIVE MODE STUB - no real order is sent yet
  return recordTrade({
    ...data,
    signal: data.signal + " - LIVE READY ONLY"
  });
}

// HOME DASHBOARD
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KUBER99999</title>
<style>
body{background:#020617;color:white;text-align:center;font-family:Arial;padding:20px}
.card{background:#1e293b;margin:15px auto;padding:20px;border-radius:20px;max-width:430px}
h1{color:#22c55e}
.green{color:#22c55e}
.red{color:#ef4444}
.yellow{color:#facc15}
button{background:#22c55e;color:white;border:none;padding:12px;border-radius:10px;font-size:16px}
</style>
</head>
<body>
<h1>KUBER99999</h1>

<div class="card">
<h2 id="signal">Loading...</h2>
<p>Price: <span id="price">-</span></p>
<p id="entry"></p>
<p id="sl"></p>
<p id="target"></p>
<p id="confidence"></p>
<p>Mode: <span id="mode">-</span></p>
<p>Trades Today: <span id="trades">-</span></p>
<p>Daily PnL: <span id="pnl">-</span></p>
</div>

<button onclick="copyTrade()">Copy Trade</button>
<p id="msg"></p>

<script>
function loadSignal(){
  fetch('/signal')
    .then(res => res.json())
    .then(data => {
      document.getElementById("signal").innerText = data.signal;
      document.getElementById("price").innerText = data.price;
      document.getElementById("entry").innerText = "Entry: " + data.entry;
      document.getElementById("sl").innerText = "SL: " + data.sl;
      document.getElementById("target").innerText = "Target: " + data.target;
      document.getElementById("confidence").innerText = "Confidence: " + data.confidence;
      document.getElementById("mode").innerText = data.mode;
      document.getElementById("trades").innerText = data.tradesToday;
      document.getElementById("pnl").innerText = data.dailyPnL;

      const s = document.getElementById("signal");
      if(data.signal.includes("BUY")) s.className = "green";
      else if(data.signal.includes("SELL")) s.className = "red";
      else s.className = "yellow";
    })
    .catch(() => {
      document.getElementById("signal").innerText = "Backend Error";
    });
}

function copyTrade(){
  const text =
    "KUBER99999 TRADE\\n" +
    "Signal: " + document.getElementById("signal").innerText + "\\n" +
    "Price: " + document.getElementById("price").innerText + "\\n" +
    document.getElementById("entry").innerText + "\\n" +
    document.getElementById("sl").innerText + "\\n" +
    document.getElementById("target").innerText + "\\n" +
    document.getElementById("confidence").innerText;

  navigator.clipboard.writeText(text);
  document.getElementById("msg").innerText = "Copied";
}

loadSignal();
setInterval(loadSignal, 5000);
</script>
</body>
</html>
  `);
});

// SIGNAL API
app.get("/signal", async (req, res) => {
  try {
    const price = await getMarketPrice();
    let data = generateSignal(price);
    data = riskCheck(data);

    if (
      data.signal !== lastSignal &&
      !data.signal.includes("NO TRADE") &&
      !data.signal.includes("WAIT")
    ) {
      lastSignal = data.signal;

      await sendTelegram(
        "KUBER99999 SIGNAL\\n" +
        data.signal +
        "\\nEntry: " + data.entry +
        "\\nSL: " + data.sl +
        "\\nTarget: " + data.target +
        "\\nConfidence: " + data.confidence +
        "\\nMode: " + MODE
      );

      await executeTrade(data);
    }

    res.json({
      price,
      ...data,
      mode: MODE,
      killSwitch: KILL_SWITCH,
      tradesToday,
      dailyPnL
    });
  } catch (e) {
    res.status(500).json({ error: "Signal error" });
  }
});

// HISTORY
app.get("/history", (req, res) => {
  res.json(ledger);
});

// ADMIN AUTH
function auth(req, res, next) {
  if (req.headers["x-owner-key"] === OWNER_KEY) return next();
  res.status(403).json({ error: "Unauthorized" });
}

// ADMIN MODE
app.post("/admin/mode", auth, (req, res) => {
  const mode = req.body.mode;
  if (mode !== "PAPER" && mode !== "LIVE") {
    return res.status(400).json({ error: "Use PAPER or LIVE" });
  }

  MODE = mode;
  res.json({ mode: MODE });
});

// ADMIN KILL SWITCH
app.post("/admin/kill", auth, (req, res) => {
  KILL_SWITCH = Boolean(req.body.on);
  res.json({ killSwitch: KILL_SWITCH });
});

// ADMIN RESET
app.post("/admin/reset", auth, (req, res) => {
  tradesToday = 0;
  dailyPnL = 0;
  ledger = [];
  lastSignal = "";
  res.json({ reset: true });
});

// HEALTH
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    mode: MODE,
    killSwitch: KILL_SWITCH,
    tradesToday,
    dailyPnL,
    time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("KUBER99999 running on port", PORT));
