import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CompanyBalance, Expense } from '../../types/database.types';
import { DollarSign, TrendingUp, Users, Receipt, CreditCard, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState<CompanyBalance | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [expenseStats, setExpenseStats] = useState({
    total: 0,
    count: 0,
    recent: [] as Expense[]
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Get company balance
        const { data: balanceData } = await supabase
          .from('company_balance')
          .select('*')
          .single();
        
        setBalance(balanceData);
        
        // Get user count
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        setUserCount(userCount || 0);
        
        // Get expense stats
        const { data: recentExpenses } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        const { data: expenseSummary } = await supabase
          .rpc('get_expense_summary');
        
        setExpenseStats({
          total: expenseSummary?.[0]?.total_amount || 0,
          count: expenseSummary?.[0]?.expense_count || 0,
          recent: recentExpenses || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-pulse">Loading dashboard data...</div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Company Balance Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <DollarSign className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Company Balance</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      ₹{balance?.amount.toFixed(2) || '0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/admin/balance"
                className="font-medium text-blue-600 hover:text-blue-900"
              >
                Manage funds
              </Link>
            </div>
          </div>
        </div>
        
        {/* Total Expenses Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      ₹{expenseStats.total.toFixed(2)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/admin/expenses"
                className="font-medium text-blue-600 hover:text-blue-900"
              >
                View all expenses
              </Link>
            </div>
          </div>
        </div>
        
        {/* Users Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <Users className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{userCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/admin/users"
                className="font-medium text-blue-600 hover:text-blue-900"
              >
                Manage users
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Expenses */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Expenses</h2>
          <Link
            to="/admin/expenses"
            className="text-sm font-medium text-blue-600 hover:text-blue-900"
          >
            View all
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {expenseStats.recent.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No expenses recorded yet.
              </li>
            ) : (
              expenseStats.recent.map((expense) => (
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
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex sm:space-x-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <CreditCard className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <p>Expense #{expense.id.slice(-5)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>
                            {format(new Date(expense.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}