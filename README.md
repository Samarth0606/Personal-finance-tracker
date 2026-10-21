# Personal Finance Tracker

A simple app for recording income and expenses. You can add transactions, filter them by month and category, see your balance, and see which categories take the most money.

Everything is saved in your own web browser. There is no account and no server.

## How to open it

Double-click `index.html`. It opens in your web browser.

## What it can do

- Add an income or expense with a description, amount, category and date
- See total income, total expenses and the balance
- Filter by month and by category
- See expenses grouped by category
- Delete a transaction
- Reset to sample data at any time (link at the bottom of the page)

## What is in this folder

| File | What it does |
|---|---|
| `index.html` | The page: its headings, form and sections |
| `css/styles.css` | How the page looks: colours, spacing and layout |
| `js/finance.js` | The rules and the maths: checking a new transaction, totals, filters, grouping |
| `js/app.js` | Connects the page to the rules: reads the form, saves data, redraws the page |
| `package.json` | Project details. It also sets up the `npm test` command |

## Changing the currency

Open `js/app.js`. At the top, change `LOCALE` and `CURRENCY` (for example `"en-US"` and `"USD"`). The rupee symbol in the form label is in `index.html`.

## Running automated tests

Tests are run with Node.js (version 18 or newer). Once tests exist, run:

```
npm test
```
