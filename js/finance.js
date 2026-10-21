/**
 * finance.js
 * ----------
 * The "brain" of the app. These functions do the maths and the rules:
 * checking a new transaction, filtering, totalling and grouping.
 *
 * Nothing in this file touches the web page. That keeps it easy to read
 * and easy to test. The page itself is handled by app.js.
 */
(function (root, factory) {
  // This wrapper lets the same file work in the browser (as "Finance")
  // and in Node.js (through require), which is useful for automated tests.
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Finance = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // The categories people can choose from.
  const INCOME_CATEGORIES = ["Salary", "Freelance", "Other income"];
  const EXPENSE_CATEGORIES = [
    "Food",
    "Rent",
    "Transport",
    "Utilities",
    "Shopping",
    "Entertainment",
    "Health",
    "Other"
  ];

  /** Returns the category list that matches "income" or "expense". */
  function getCategoriesFor(type) {
    return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  }

  /** Rounds to 2 decimal places so money never shows values like 0.30000000000000004. */
  function round2(number) {
    return Math.round((number + Number.EPSILON) * 100) / 100;
  }

  /** Makes a short, practically unique id for each transaction. */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /** Turns a Date into text like "2026-10-05" using the local calendar day. */
  function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  /** Checks that text looks like a real calendar date in YYYY-MM-DD form. */
  function isValidDateString(text) {
    if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return false;
    }
    const parts = text.split("-").map(Number);
    const check = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return (
      check.getUTCFullYear() === parts[0] &&
      check.getUTCMonth() === parts[1] - 1 &&
      check.getUTCDate() === parts[2]
    );
  }

  /**
   * Checks the details and builds a transaction object.
   * Throws an Error with a friendly message if something is wrong.
   */
  function createTransaction(input) {
    const description = String(input.description || "").trim();
    const amount = Number(input.amount);

    if (!description) {
      throw new Error("Please enter a description.");
    }
    if (description.length > 60) {
      throw new Error("Description must be 60 characters or fewer.");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be a number greater than zero.");
    }
    if (input.type !== "income" && input.type !== "expense") {
      throw new Error("Please choose income or expense.");
    }
    if (!getCategoriesFor(input.type).includes(input.category)) {
      throw new Error("Please choose a category.");
    }
    if (!isValidDateString(input.date)) {
      throw new Error("Please choose a valid date.");
    }

    return {
      id: generateId(),
      description: description,
      amount: round2(amount),
      type: input.type,
      category: input.category,
      date: input.date
    };
  }

  /** Returns a new list sorted with the newest date first. */
  function sortByDateDesc(transactions) {
    return transactions.slice().sort(function (a, b) {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return 0;
    });
  }

  /**
   * Keeps only the transactions that match the chosen filters.
   * month    : "all" or a value like "2026-10"
   * category : "all" or a category name like "Food"
   */
  function filterTransactions(transactions, filters) {
    const month = (filters && filters.month) || "all";
    const category = (filters && filters.category) || "all";

    return transactions.filter(function (t) {
      const monthMatches = month === "all" || t.date.slice(0, 7) === month;
      const categoryMatches = category === "all" || t.category === category;
      return monthMatches && categoryMatches;
    });
  }

  /** Lists every month that has at least one transaction, newest first. */
  function getAvailableMonths(transactions) {
    const months = [];
    transactions.forEach(function (t) {
      const month = t.date.slice(0, 7);
      if (!months.includes(month)) {
        months.push(month);
      }
    });
    return months.sort().reverse();
  }

  /** Adds up income and expenses, and works out the balance. */
  function calculateTotals(transactions) {
    let income = 0;
    let expenses = 0;

    transactions.forEach(function (t) {
      if (t.type === "income") {
        income += t.amount;
      } else {
        expenses += t.amount;
      }
    });

    return {
      income: round2(income),
      expenses: round2(expenses),
      balance: round2(income - expenses)
    };
  }

  /**
   * Groups expenses by category, largest first.
   * Each item looks like { category: "Food", total: 4330, percent: 21.5 }
   */
  function getCategoryBreakdown(transactions) {
    const totals = {};
    let allExpenses = 0;

    transactions.forEach(function (t) {
      if (t.type !== "expense") return;
      totals[t.category] = (totals[t.category] || 0) + t.amount;
      allExpenses += t.amount;
    });

    return Object.keys(totals)
      .map(function (category) {
        return {
          category: category,
          total: round2(totals[category]),
          percent: allExpenses === 0 ? 0 : round2((totals[category] / allExpenses) * 100)
        };
      })
      .sort(function (a, b) {
        return b.total - a.total;
      });
  }

  /**
   * Creates example transactions dated relative to "today",
   * so the app always looks fresh the first time it opens.
   */
  function buildSampleTransactions(today) {
    const samples = [
      [0, "Chai and breakfast", 180, "expense", "Food"],
      [1, "Metro card recharge", 500, "expense", "Transport"],
      [2, "Weekly groceries", 2350, "expense", "Food"],
      [3, "Electricity bill", 1860, "expense", "Utilities"],
      [5, "Monthly salary", 85000, "income", "Salary"],
      [6, "Movie night", 750, "expense", "Entertainment"],
      [8, "Headphones (online order)", 2999, "expense", "Shopping"],
      [10, "Logo design project", 12000, "income", "Freelance"],
      [12, "Cab to the airport", 1150, "expense", "Transport"],
      [14, "Pharmacy", 640, "expense", "Health"],
      [18, "Dinner with friends", 1800, "expense", "Food"],
      [22, "Internet bill", 999, "expense", "Utilities"],
      [25, "Rent", 24000, "expense", "Rent"],
      [30, "Streaming subscription", 499, "expense", "Entertainment"],
      [35, "Monthly salary", 85000, "income", "Salary"],
      [37, "Weekly groceries", 2100, "expense", "Food"],
      [40, "Rent", 24000, "expense", "Rent"],
      [44, "Auto rickshaw rides", 620, "expense", "Transport"]
    ];

    const list = samples.map(function (row) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - row[0]);
      return createTransaction({
        description: row[1],
        amount: row[2],
        type: row[3],
        category: row[4],
        date: toDateString(date)
      });
    });

    return sortByDateDesc(list);
  }

  return {
    INCOME_CATEGORIES: INCOME_CATEGORIES,
    EXPENSE_CATEGORIES: EXPENSE_CATEGORIES,
    getCategoriesFor: getCategoriesFor,
    toDateString: toDateString,
    createTransaction: createTransaction,
    sortByDateDesc: sortByDateDesc,
    filterTransactions: filterTransactions,
    getAvailableMonths: getAvailableMonths,
    calculateTotals: calculateTotals,
    getCategoryBreakdown: getCategoryBreakdown,
    buildSampleTransactions: buildSampleTransactions
  };
});
