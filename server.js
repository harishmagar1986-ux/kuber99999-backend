const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// Home route
app.get("/", (req, res) => {
  res.send("KUBER99999 BACKEND LIVE");
});

// Signal route
app.get("/signal", (req, res) => {

  // ✅ ALWAYS DEFINE PRICE FIRST
  let price = Math.floor(20000 + Math.random() * 1000);

  let signal = "WAIT";
  let entry = "-";
  let sl = "-";
  let target = "-";
  let confidence = "50%";

  let random = Math.random();

  if (random < 0.4) {
    signal = "BUY NIFTY CE";
    entry = price;
    sl = price - 50;
    target = price + 100;
    confidence = "80%";

  } else if (random < 0.8) {
    signal = "SELL NIFTY PE";
    entry = price;
    sl = price + 50;
    target = price - 100;
    confidence = "75%";
  }

  res.json({ price, signal, entry, sl, target, confidence });
});

// Port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on", PORT));
