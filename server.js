const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("KUBER99999 BACKEND LIVE");
});

app.get("/signal", (req, res) => {
  const price = Math.floor(20000 + Math.random() * 1000);

  let signal, entry, sl, target, confidence;
  const random = Math.random();

  if (random < 0.45) {
    signal = "BUY NIFTY CE";
    entry = price;
    sl = price - 50;
    target = price + 100;
    confidence = "80%";
  } else if (random < 0.90) {
    signal = "SELL NIFTY PE";
    entry = price;
    sl = price + 50;
    target = price - 100;
    confidence = "75%";
  } else {
    signal = "WAIT";
    entry = "-";
    sl = "-";
    target = "-";
    confidence = "50%";
  }

  res.json({ price, signal, entry, sl, target, confidence });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on", PORT));
