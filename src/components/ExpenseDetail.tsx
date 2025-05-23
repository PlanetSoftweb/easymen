import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Expense, User } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Receipt } from 'lucide-react';

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id || !currentUser) return;
    
    const fetchExpense = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get the expense details
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw new Error('Expense not found');
        }
        
        // Check if the current user has access to this expense
        if (data.user_id !== currentUser.id && currentUser.role !== 'admin') {
          throw new Error('You do not have permission to view this expense');
        }
        
        setExpense(data);
        
        // Fetch the user who created this expense
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user_id)
          .single();
        
        if (!userError) {
          setUser(userData);
        }
      } catch (err) {
        console.error('Error fetching expense details:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpense();
  }, [id, currentUser]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-pulse">Loading expense details...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 flex items-center text-sm font-medium text-red-700 hover:text-red-800"
            >
              <ArrowLeft size={16} className="mr-1" />
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!expense) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Expense not found</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 flex items-center text-sm font-medium text-yellow-700 hover:text-yellow-800"
            >
              <ArrowLeft size={16} className="mr-1" />
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Expense Details</h2>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back
            </button>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {expense.category}
                </span>
              </dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{expense.description}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">₹{expense.amount.toFixed(2)}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(expense.created_at), 'MMMM d, yyyy, h:mm a')}
              </dd>
            </div>
            
            {currentUser.role === 'admin' && user && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Submitted By</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
              </div>
            )}
            
            {expense.photo_url && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Receipt</dt>
                <dd className="mt-1">
                  <a
                    href={expense.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="w-full aspect-[3/4] relative bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={expense.photo_url}
                        alt="Receipt"
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white p-2 rounded-full">
                          <Receipt size={24} className="text-gray-600" />
                        </div>
                      </div>
                    </div>
                    <span className="mt-2 block text-sm font-medium text-blue-600 group-hover:text-blue-800">
                      View full receipt
                    </span>
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}