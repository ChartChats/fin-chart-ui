const schema = {
  "exchange": "NASDQ",          // NASDQ / NYSE / ...
  "symbol": "AAPL",             // AAPL / MSFT / ....
  "type": "stock",              // stock / index / forex / crypto
  "description": "Apple Inc.",  // description of the stock
  "ticker": "AAPL",
  "indicator": {
    "name": "RSA",
    "value": "rsa",
    "properties": {
      "period": 14
    }
  },
  "interval": "1D",             // 1D / 1W / 1M / 1Y
  "range": "1Y",                // 1D / 1W / 1M / 1Y / ALL
  "theme": "dark",              // dark / light
  "date_from": 12344343,        // number in epoch time
  "date_to": 12344343           // number in epoch time
}