
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CountUp from 'react-countup';

export default function UserCredits() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => 
    activeType === 'all' ? true : transaction.type === activeType
  );

  return (
    <div className="pb-20 md:pb-0">
      <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">My Credits</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div 
          className={`bg-blue-50 p-3 rounded-xl shadow-sm border border-blue-100 cursor-pointer transition-all ${activeType === 'company' ? 'ring-2 ring-blue-400' : ''}`}
          onClick={() => setActiveType(activeType === 'company' ? 'all' : 'company')}
        >
          <div className="text-blue-800 text-xs md:text-sm font-medium mb-1">Company Balance</div>
          <div className="text-lg md:text-xl font-bold text-blue-900 flex items-center">
            ₹<CountUp end={currentUser?.company_balance || 0} decimals={2} duration={1} separator="," />
          </div>
        </div>

        <div 
          className={`bg-orange-50 p-3 rounded-xl shadow-sm border border-orange-100 cursor-pointer transition-all ${activeType === 'personal' ? 'ring-2 ring-orange-400' : ''}`}
          onClick={() => setActiveType(activeType === 'personal' ? 'all' : 'personal')}
        >
          <div className="text-orange-800 text-xs md:text-sm font-medium mb-1">Personal Balance</div>
          <div className="text-lg md:text-xl font-bold text-orange-900 flex items-center">
            ₹<CountUp end={currentUser?.personal_balance || 0} decimals={2} duration={1} separator="," />
          </div>
        </div>

        <div 
          className={`bg-green-50 p-3 rounded-xl shadow-sm border border-green-100 cursor-pointer transition-all ${activeType === 'salary' ? 'ring-2 ring-green-400' : ''}`}
          onClick={() => setActiveType(activeType === 'salary' ? 'all' : 'salary')}
        >
          <div className="text-green-800 text-xs md:text-sm font-medium mb-1">Salary Balance</div>
          <div className="text-lg md:text-xl font-bold text-green-900 flex items-center">
            ₹<CountUp end={currentUser?.salary_balance || 0} decimals={2} duration={1} separator="," />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                      transaction.type === 'company' ? 'bg-blue-100 text-blue-800' :
                      transaction.type === 'personal' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {transaction.type}
                      {transaction.type === 'salary' && transaction.salary_month && (
                        <span className="ml-1 text-gray-500">({format(new Date(transaction.salary_month), 'MMM yyyy')})</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-green-600 font-medium">
                      ₹{transaction.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">
                    {transaction.description || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(transaction.created_at), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
