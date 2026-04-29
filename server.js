const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("KUBER99999 BACKEND LIVE");
});

app.get("/signal", (req, res) => {
  let price = Math.floor(20000 + Math.random() * 1000);

  let signal = "WAIT";
  let entry = "-";
  let sl = "-";
  let target = "-";
  let confidence = "50%";

  if (price % 3 === 0) {
    signal = "BUY NIFTY CE";
    entry = price;
    sl = price - 50;
    target = price + 100;
    confidence = "80%";
  } else if (price % 5 === 0) {
    signal = "SELL NIFTY PE";
    entry = price;
    sl = price + 50;
    target = price - 100;
    confidence = "75%";
  }

  res.json({ price, signal, entry, sl, target, confidence });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on", PORT));
