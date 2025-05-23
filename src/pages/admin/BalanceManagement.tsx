import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/database.types';
import { format } from 'date-fns';
import Modal from '../../components/Modal';
import { Plus, Search, Filter } from 'lucide-react';
import SuccessModal from '../../components/SuccessModal';

export default function BalanceManagement() {
  const { currentUser } = useAuth();

  const playSuccessSound = () => {
    const audio = new Audio('https://scholarship.vasanigroup.co.in/wp-content/uploads/2025/05/success-1-6297.mp3');
    audio.play().catch(error => console.error('Error playing sound:', error));
  };
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(25);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    type: 'company',
    salaryMonth: format(new Date(), 'yyyy-MM'),
    description: ''
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    fetchUsers();
    fetchTransactions();
  }, [currentUser]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('balance_transactions')
        .select(`
          *,
          users:user_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'admin') {
      toast.error('Only admins can add funds');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);

    try {
      const selectedUser = users.find(u => u.id === formData.userId);
      if (!selectedUser) throw new Error('User not found');

      const updates: any = {};
      if (formData.type === 'company') {
        updates.company_balance = (selectedUser.company_balance || 0) + amount;
      } else if (formData.type === 'personal') {
        updates.personal_balance = (selectedUser.personal_balance || 0) + amount;
      } else if (formData.type === 'salary') {
        updates.salary_balance = (selectedUser.salary_balance || 0) + amount;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', formData.userId);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('balance_transactions')
        .insert({
          user_id: formData.userId,
          amount: amount,
          type: formData.type,
          salary_month: formData.type === 'salary' ? new Date(formData.salaryMonth) : null,
          description: formData.description
        });

      if (transactionError) throw transactionError;

      // Play success sound and vibrate
      playSuccessSound();
      if ('vibrate' in navigator) {
        navigator.vibrate(1000); // Vibrate for 1 second
      }
      setIsModalOpen(false);
      setIsSuccessModalOpen(true);
      setFormData({
        userId: '',
        amount: '',
        type: 'company',
        salaryMonth: format(new Date(), 'yyyy-MM'),
        description: ''
      });

      fetchUsers();
      fetchTransactions();
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.users?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    const matchesDate = dateFilter === '' || format(new Date(transaction.created_at), 'yyyy-MM-dd') === dateFilter;
    return matchesSearch && matchesFilter && matchesDate;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Balance Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Funds
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Transactions List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
               <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg bg-white"
                />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white"
              >
                <option value="all">All Types</option>
                <option value="company">Company</option>
                <option value="personal">Personal</option>
                <option value="salary">Salary</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions
                  .slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage)
                  .map((transaction: any) => (
                  <tr 
                    key={transaction.id} 
                    className="hover:bg-gray-50 cursor-pointer" 
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setIsTransactionModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{transaction.users?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize shadow-sm ${
                        transaction.type === 'company' ? 'bg-blue-100 text-blue-700' :
                        transaction.type === 'personal' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full ${transaction.amount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {transaction.amount >= 0 ? '+' : '-'}₹{Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(transaction.created_at), 'dd MMM yyyy hh:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex justify-center flex-1 gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {Math.ceil(filteredTransactions.length / transactionsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTransactions.length / transactionsPerPage)))}
                disabled={currentPage >= Math.ceil(filteredTransactions.length / transactionsPerPage)}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div>
                <label htmlFor="transactionsPerPage" className="mr-2">Entries per page:</label>
                <select
                    id="transactionsPerPage"
                    value={transactionsPerPage}
                    onChange={(e) => setTransactionsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border rounded-md bg-white"
                >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                </select>
            </div>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Funds"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select User</label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Choose user to add funds</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.role === 'admin' ? '(Admin)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fund Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="company">Company Balance</option>
              <option value="personal">Personal Account</option>
              <option value="salary">Monthly Salary</option>
            </select>
          </div>

          {formData.userId && users.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-100 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Current Balances</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg transition-colors ${formData.type === 'company' ? 'bg-blue-100' : ''}`}>
                  <p className="text-xs text-blue-700">Company Balance</p>
                  <p className="text-sm font-semibold text-blue-900">₹{users.find(u => u.id === formData.userId)?.company_balance || 0}</p>
                </div>
                <div className={`p-3 rounded-lg transition-colors ${formData.type === 'personal' ? 'bg-blue-100' : ''}`}>
                  <p className="text-xs text-blue-700">Personal Balance</p>
                  <p className="text-sm font-semibold text-blue-900">₹{users.find(u => u.id === formData.userId)?.personal_balance || 0}</p>
                </div>
                <div className={`p-3 rounded-lg transition-colors ${formData.type === 'salary' ? 'bg-blue-100' : ''}`}>
                  <p className="text-xs text-blue-700">Salary Balance</p>
                  <p className="text-sm font-semibold text-blue-900">₹{users.find(u => u.id === formData.userId)?.salary_balance || 0}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
            <div className="mt-1 relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 text-lg">₹</span>
              </div>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Enter amount to add"
                className="block w-full pl-8 pr-12 py-3 rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {formData.type === 'salary' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Month</label>
              <input
                type="month"
                name="salaryMonth"
                value={formData.salaryMonth}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Add a note about this transaction"
              className="mt-1 block w-full px-4 py-3 rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Add Funds'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Transaction Details"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">User</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedTransaction.users?.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Amount</h4>
              <p className="mt-1 text-sm text-green-600">+₹{selectedTransaction.amount.toFixed(2)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Type</h4>
              <p className="mt-1">
                <span className="px-2 py-1 text-xs font-medium rounded-full capitalize bg-blue-100 text-blue-800">
                  {selectedTransaction.type}
                </span>
              </p>
            </div>
            {selectedTransaction.salary_month && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Salary Month</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(selectedTransaction.salary_month), 'MMMM yyyy')}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-500">Date</h4>
              <p className="mt-1 text-sm text-gray-900">
                {format(new Date(selectedTransaction.created_at), 'dd MMM yyyy HH:mm')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedTransaction.description || '-'}</p>
            </div>
          </div>
        )}
      </Modal>

      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}