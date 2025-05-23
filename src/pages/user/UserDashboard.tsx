import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import CountUp from 'react-countup';
import Modal from '../../components/Modal';
import ExpenseForm from '../../components/ExpenseForm';
import { useAuth } from '../../contexts/AuthContext';
import { CompanyBalance, Expense } from '../../types/database.types';
import { DollarSign, Plus, TrendingUp, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export default function UserDashboard() {
  const { currentUser, login } = useAuth();
  const [balance, setBalance] = useState<CompanyBalance | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [expenseStats, setExpenseStats] = useState({ total: 0, count: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refresh user data periodically
  useEffect(() => {
    if (!currentUser) return;

    const refreshUserData = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (data) {
          // Update local storage and auth context
          localStorage.setItem('expense_app_user', JSON.stringify(data));
          login(data.name, data.pin);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };

    // Refresh every 10 seconds
    const interval = setInterval(refreshUserData, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      try {
        // Get company balance
        const { data: balanceData } = await supabase
          .from('company_balance')
          .select('*')
          .single();

        setBalance(balanceData);

        // Get recent expenses for this user
        const { data: expenses } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentExpenses(expenses || []);

        // Get expense summary for this user and recent expenses
        const { data: userExpenses, error: expenseError, count } = await supabase
          .from('expenses')
          .select('*', { count: 'exact' })
          .eq('user_id', currentUser.id);

        if (expenseError) {
          throw expenseError;
        }

        // Calculate total amount
        const totalAmount = userExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

        setExpenseStats({
          total: totalAmount,
          count: count || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Dashboard</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          New
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Company Balance Card */}
        <div className="banking-card bg-gradient-to-br from-[#1a1f36] to-[#121527] p-5 relative overflow-hidden rounded-xl border border-opacity-30 border-[#C0C0C0]">
          <div className="card-pattern"></div>
          <div className="flex justify-between items-center absolute top-4 left-4 right-4">
            <div className="text-white text-xl font-bold italic tracking-wider">
              SmartSpend
            </div>
            <div className="text-white/80 text-sm tracking-wider">
              {currentUser?.name || 'User'}
            </div>
          </div>
          <div className="mt-12">
            <div className="card-chip"></div>
          </div>
          <div className="card-number text-3xl font-bold text-white tracking-wider mb-6 flex items-center gap-1">
            <span className="text-white/80 text-2xl">₹</span>
            <CountUp
              end={currentUser?.company_balance || 0}
              decimals={2}
              duration={1.5}
              separator=","
              prefix=""
            />
          </div>
          <div className="card-details text-white/80">
            <div>
              <div className="text-sm font-medium tracking-wider">COMPANY BALANCE</div>
              <div className="text-sm font-medium tracking-wider mt-1">EXPENSE SYSTEM</div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* My Expenses Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <Receipt className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">My Expenses</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      <CountUp
                        end={expenseStats.count}
                        duration={1}
                      />
                      {" "}expense{expenseStats.count !== 1 ? 's' : ''}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/expenses"
                className="font-medium text-blue-600 hover:text-blue-900"
              >
                View all
              </Link>
            </div>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      ₹{expenseStats.total.toFixed(2)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Expenses</h2>
          <Link
            to="/expenses"
            className="text-sm font-medium text-blue-600 hover:text-blue-900"
          >
            View all
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {recentExpenses.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No expenses recorded yet. Create your first expense!
              </li>
            ) : (
              recentExpenses.map((expense) => (
                <li key={expense.id}>
                  <Link
                    to={`/expenses/${expense.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="truncate">
                          <div className="flex text-sm">
                            <p className="font-medium text-blue-600 truncate">{expense.description}</p>
                            <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                              in {expense.category}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            ₹{expense.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <p>
                          {format(new Date(expense.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Expense"
      >
        <ExpenseForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}