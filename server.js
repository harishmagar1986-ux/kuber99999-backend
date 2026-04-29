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
} else {
  signal = "WAIT";
  entry = "-";
  sl = "-";
  target = "-";
  confidence = "50%";
}
