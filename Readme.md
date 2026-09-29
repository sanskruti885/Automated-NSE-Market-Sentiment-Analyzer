# NSE Market Sentiment Analyzer & Stock Screener

An automated stock market analysis tool built using **Node.js, TypeScript, Puppeteer, and Axios** that fetches market data from the National Stock Exchange (NSE) of India, evaluates market sentiment using percentage-change aggregation, and identifies potential trading candidates based on a rule-based strategy.

The project automates market data collection, stock ranking, and instrument-token mapping, while maintaining execution logs for monitoring and analysis.

## Overview

The system periodically retrieves NSE market gainers and losers, compares their aggregate percentage movements, and determines a market direction signal: Buy, Sell, or Balanced.

Based on the resulting signal, it selects the corresponding group of stocks, ranks them using a configurable parameter, maps the selected stocks to their Angel One instrument tokens, and prints the results to the console and log files.

The system currently focuses on automated market analysis and stock screening. It does not execute live trades.

## Key Features

* **Automated NSE Data Fetching:** Retrieves live-analysis data for market gainers and losers from NSE endpoints using Axios and Puppeteer-based session-cookie handling.

* **Scheduled Market Analysis:** Uses `node-cron` to execute the analysis strategy every three minutes.

* **Rule-Based Market Sentiment Analysis:** Calculates the aggregate absolute percentage change of gainers and losers to determine the market direction according to predefined conditions.

* **Dynamic Stock Ranking:** Sorts selected stocks in ascending or descending order using a configurable numeric field defined in environment variables.

* **Instrument Token Mapping:** Fetches the Angel One OpenAPI Scrip Master data and maps selected NSE stocks to their corresponding instrument symbols and tokens.

* **Automated Logging:** Records execution output and errors in separate log files for debugging and monitoring.

## System Architecture

```text
          NSE India
              |
              v
    Puppeteer + Axios
       Data Fetching
              |
       +------+------+
       |             |
       v             v
    Gainers        Losers
       |             |
       v             v
   Calculate      Calculate
   Aggregate      Aggregate
   Percentage     Percentage
   Change         Change
       |             |
       +------+------+
              |
              v
     Compare Aggregates
              |
       +------+------+ 
       |      |      |
       v      v      v
      BUY    SELL  BALANCED
       |      |      |
       v      v      |
   Sort     Sort     |
   Gainers  Losers   |
       |      |      |
       +------+------+
              |
              v
       Angel One Scrip
       Master Lookup
              |
              v
       Print Stock Table
              |
              v
       Logger / Log Files
```

## Technology Stack

| Technology                     | Purpose                                           |
| ------------------------------ | ------------------------------------------------- |
| TypeScript                     | Application logic and type safety                 |
| Node.js                        | Runtime environment                               |
| Puppeteer                      | Browser automation and session-cookie acquisition |
| Axios                          | HTTP requests to NSE endpoints                    |
| node-cron                      | Scheduling automated analysis                     |
| dotenv                         | Environment variable configuration                |
| Angel One OpenAPI Scrip Master | Instrument symbol and token lookup                |
| Node.js File System            | Logging to local files                            |

## How It Works

### 1. Fetch NSE Market Data

The application retrieves data from the following NSE endpoints:

**Market Gainers**

```text
https://www.nseindia.com/api/live-analysis-variations?index=gainers
```

**Market Losers**

```text
https://www.nseindia.com/api/live-analysis-variations?index=loosers
```

Puppeteer launches a headless browser and navigates to NSE India to establish a session and acquire cookies.

Axios then uses the collected cookies and appropriate request headers to fetch the JSON response.

The returned data is processed using the `FoSecDataItem` interface.

### 2. Calculate Market Sentiment

The strategy calculates the sum of the absolute percentage changes for the stocks in each dataset.

For each group:

$$
S = \sum_{i=1}^{n} |\text{perChange}_i|
$$

Where:

* \(S\) is the aggregate percentage-change magnitude.
* \(n\) is the number of stocks in the respective dataset.
* `perChange` is the percentage change reported for each stock.

The gainers' and losers' aggregates are then compared.

| Condition                            | Strategy Output             |
| ------------------------------------ | --------------------------- |
| Gainers aggregate > Losers aggregate | Buy signal; process gainers |
| Losers aggregate > Gainers aggregate | Sell signal; process losers |
| Both aggregates are equal            | Balanced market             |

This is a rule-based comparison of the returned gainers and losers datasets, not a comprehensive measurement of the entire market or a guaranteed prediction of future price movements.

### 3. Rank Stocks

Once the strategy determines the market direction, it sorts the selected stock list using the numeric field specified in the `.env` file.

The sorting logic is implemented using two functions:

* `sortDescending()` — sorts stocks from highest to lowest value of the configured field.
* `sortAscending()` — sorts stocks from lowest to highest value of the configured field.

For example, configuring `filter_parameter=perChange` ranks gainers by their percentage change in descending order and losers by their percentage change in ascending order.

### 4. Map Stocks to Instrument Tokens

The `get_token.ts` module retrieves the Angel One OpenAPI Scrip Master JSON file:

```text
https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json
```

It matches each selected NSE stock against the instrument symbol formed using:

```text
SYMBOL-SERIES
```

For example:

```text
SBIN-EQ
```

When a matching entry is found, its symbol and instrument token are returned.

This enables the strategy output to include instrument identifiers that can be used in further market-data or trading-system integrations.

The current implementation performs token lookup and does not submit orders to Angel One.

### 5. Scheduled Execution and Logging

The analysis runs automatically every three minutes using `node-cron`.

```typescript
cron.schedule('*/3 * * * *', () => {
    console.log(
        "Running cron job at: ",
        new Date().toLocaleTimeString()
    );

    analysis_strategy();
});
```

The custom logger overrides `console.log()` and `console.error()` to write application output to files while also preserving terminal output.

| Log File            | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `scraper.log`       | General execution logs, market signals, and stock screening output |
| `scraper-error.log` | Error messages and exceptions                                      |

Both files are opened in append mode, so new log entries are added to existing files.

## Project Structure

The following represents the main files and their responsibilities:

```text
NSE-Market-Analyzer/
│
├── Fetch_Data.ts
│   └── NSE data fetching, sentiment analysis,
│       stock sorting, and result printing
│
├── Fetch_Data_Model.ts
│   └── TypeScript interface for NSE stock data
│
├── Get_Token.ts
│   └── Angel One instrument-token mapping
│
├── logger.ts
│   └── Console logging and error logging
│
├── trial.ts
│   └── Experimental implementation for testing
│
├── .env
│   └── Runtime configuration
│
├── .gitignore
│   └── Files excluded from version control
│
├── package.json
│   └── Dependencies and npm scripts
│
└── README.md
    └── Project documentation
```

## Installation and Setup

### Prerequisites

* Node.js and npm installed.
* Git installed.
* Internet access to retrieve NSE and instrument-master data.

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd NSE-Market-Analyzer
```

### 2. Install dependencies

```bash
npm install
```

Ensure the project dependencies include Puppeteer, Axios, node-cron, and dotenv.

If any are missing from `package.json`, install them using:

```bash
npm install puppeteer axios node-cron dotenv
```

Install TypeScript and the required development tooling if not already configured.

### 3. Configure environment variables

Create a `.env` file in the project root.

```env
filter_parameter=perChange
```

The `filter_parameter` variable specifies the numeric field used to rank the stocks. It must correspond to a numeric property in the `FoSecDataItem` interface.

Do not commit sensitive credentials, API keys, or other private configuration values.

### 4. Run the application

Use the execution command configured in your `package.json`.

For example, if the project uses `ts-node`:

```bash
npx ts-node Fetch_Data.ts
```

Alternatively, if the project uses `tsx`:

```bash
npx tsx Fetch_Data.ts
```

Once started, the application will schedule market analysis every three minutes and write its output to the configured log files.

The exact command depends on the TypeScript runtime and npm scripts configured in your repository.

## Current Limitations

* The market-direction logic compares absolute percentage-change totals across the returned gainers and losers datasets. It does not account for market capitalization, trading volume, index weights, or the full market breadth.

* The generated Buy and Sell signals are rule-based screening outputs. They are not validated trading recommendations or guarantees of profitability.

* The current implementation does not execute trades, manage positions, or implement order-level risk controls.

* NSE data retrieval depends on website availability, session cookies, and applicable access restrictions. Endpoint changes or rate limits may affect execution.

* Instrument-token mapping depends on the availability and format of the Angel One Scrip Master data.

* Historical persistence, backtesting, and a graphical dashboard are not currently implemented.

## Future Enhancements

* Develop a React-based dashboard to visualize market signals, ranked stocks, and instrument tokens.

* Integrate WebSocket-based market data streaming for real-time price updates.

* Store historical market analysis results in MongoDB for trend analysis and backtesting.

* Introduce market breadth indicators, volume-based filters, and configurable strategy parameters.

* Add automated testing, error recovery, and execution safeguards.

* Explore broker API integration with paper trading, position tracking, and risk management controls.

## Disclaimer

This project is intended for educational, research, and software-development purposes. It is not financial advice and does not guarantee trading performance or profitability.

Market signals are generated using a predefined heuristic and should not be interpreted as recommendations to buy, sell, or short any security.

The project is not affiliated with or endorsed by NSE India or Angel One. Users are responsible for complying with applicable exchange terms, broker API conditions, and financial regulations when using market data or extending the system.

---

**Built with TypeScript and Node.js for automated NSE market analysis and stock screening.**
