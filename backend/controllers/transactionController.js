import Transaction from '../models/Transaction.js';
import { computeSummary } from '../utils/summaryHelper.js';

export const getTransactions = async (req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 });
  res.status(200).json({ success: true, data: transactions });
};

export const getTransactionById = async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  res.status(200).json({ success: true, data: transaction });
};

export const createTransaction = async (req, res) => {
  const { title, amount, category, type, date } = req.body;

  if (!title || amount == null || !category || !type) {
    res.status(400);
    throw new Error('Please provide title, amount, category, and type');
  }

  const transaction = await Transaction.create({
    title,
    amount,
    category,
    type,
    date: date || new Date(),
  });

  res.status(201).json({ success: true, data: transaction });
};

export const updateTransaction = async (req, res) => {
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  res.status(200).json({ success: true, data: transaction });
};

export const deleteTransaction = async (req, res) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id);

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  res.status(200).json({ success: true, message: 'Transaction removed' });
};

export const getSummary = async (req, res) => {
  const summary = await computeSummary();
  res.status(200).json({ success: true, data: summary });
};
