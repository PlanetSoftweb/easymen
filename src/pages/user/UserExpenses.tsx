import React from 'react';
import ExpenseList from '../../components/ExpenseList';

export default function UserExpenses() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Expenses</h1>
      <ExpenseList showAllUsers={false} />
    </div>
  );
}