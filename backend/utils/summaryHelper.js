import Transaction from '../models/Transaction.js';

export async function computeSummary() {
  const transactions = await Transaction.find();

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expenses,
    balance: income - expenses,
    count: transactions.length,
  };
}
