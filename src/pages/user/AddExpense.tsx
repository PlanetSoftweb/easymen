import React from 'react';
import ExpenseForm from '../../components/ExpenseForm';

export default function AddExpense() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Add New Expense</h1>
      <ExpenseForm />
    </div>
  );
}