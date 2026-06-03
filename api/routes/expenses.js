import { Router } from 'express';
import * as dataService from '../services/dataService';

const router = Router();

router.get('/', (req, res) => {
  const expenses = dataService.getAllExpenses();
  res.json(expenses);
});

router.get('/:id', (req, res) => {
  const expense = dataService.getExpenseById(req.params.id);
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  res.json(expense);
});

router.post('/', (req, res) => {
  const newExpense = dataService.addExpense(req.body);
  res.status(201).json(newExpense);
});

export default router;
