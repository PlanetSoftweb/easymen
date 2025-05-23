import React from 'react';
import ExpenseList from '../../components/ExpenseList';

export default function AllExpenses() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">All Expenses</h1>
      <ExpenseList showAllUsers={true} />
    </div>
  );
}