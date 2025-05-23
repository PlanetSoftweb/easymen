import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Expense, User } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Eye, Search, ChevronLeft, ChevronRight, Plus, Minus, RotateCcw } from 'lucide-react';
import Modal from '../components/Modal'; // Assuming you have a Modal component

interface ExpenseListProps {
  showAllUsers?: boolean;
}

export default function ExpenseList({ showAllUsers = false }: ExpenseListProps) {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const expensesPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchExpenses = async () => {
      setLoading(true);

      try {
        let query = supabase
          .from('expenses')
          .select('*', { count: 'exact' });

        // For regular users, only show their expenses
        if (!showAllUsers) {
          query = query.eq('user_id', currentUser.id);
        }

        // Apply search filtering if search term exists
        if (searchTerm) {
          query = query.ilike('description', `%${searchTerm}%`);
        }

        // Apply pagination
        const from = (currentPage - 1) * expensesPerPage;
        const to = from + expensesPerPage - 1;

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        if (count !== null) {
          setTotalExpenses(count);
        }

        setExpenses(data || []);

        // Fetch users if showing all expenses
        if (showAllUsers && data && data.length > 0) {
          const userIds = [...new Set(data.map(expense => expense.user_id))];
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds);

          if (userError) throw userError;

          const usersMap: { [key: string]: User } = {};
          userData?.forEach(user => {
            usersMap[user.id] = user;
          });

          setUsers(usersMap);
        }
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [currentUser, showAllUsers, searchTerm, currentPage]);

  const totalPages = Math.ceil(totalExpenses / expensesPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const openReceiptModal = (imageUrl: string) => {
    setSelectedReceipt(imageUrl);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h2 className="text-lg font-medium text-gray-900">
            {showAllUsers ? 'All Expenses' : 'My Expenses'}
          </h2>

          <div className="mt-2 sm:mt-0 relative rounded-md w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses..."
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-4 flex justify-center">
          <div className="animate-pulse">Loading expenses...</div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No expenses found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {showAllUsers && (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                  )}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Receipt
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    {showAllUsers && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {users[expense.user_id]?.name || 'Unknown'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(expense.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.image ? (
                        <div className="flex items-center gap-4">
                          <img 
                            src={expense.image} 
                            alt="Receipt thumbnail" 
                            className="h-12 w-12 object-cover rounded-md cursor-pointer hover:opacity-80"
                            onClick={() => openReceiptModal(expense.image)}
                          />
                          <button
                            onClick={() => openReceiptModal(expense.image)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-2"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No Receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      <Link 
                        to={`/expenses/${expense.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={18} className="inline" />
                        <span className="sr-only">View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * expensesPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * expensesPerPage, totalExpenses)}
                    </span>{' '}
                    of <span className="font-medium">{totalExpenses}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Receipt"
      >
        {selectedReceipt && (
          <div className="flex justify-center">
            <img 
              src={selectedReceipt} 
              alt="Receipt" 
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}