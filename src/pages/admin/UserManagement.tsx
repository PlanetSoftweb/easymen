import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/database.types';
import { toast } from 'react-toastify';
import { Users, UserPlus, Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';

export default function UserManagement() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    role: 'user',
    salary: ''
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const fetchUsers = async () => {
      setLoading(true);

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

    fetchUsers();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      pin: '',
      role: 'user',
      salary: ''
    });
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      pin: '',
      role: user.role,
      salary: user.salary?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.pin) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            pin: formData.pin,
            role: formData.role,
            salary: formData.salary ? parseFloat(formData.salary) : null
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        toast.success('User updated successfully');

        // Update local state
        setUsers(users.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...formData, salary: formData.salary ? parseFloat(formData.salary) : null }
            : user
        ));
      } else {
        const { data, error } = await supabase
          .from('users')
          .insert({
            name: formData.name,
            pin: formData.pin,
            role: formData.role,
            salary: formData.salary ? parseFloat(formData.salary) : null
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('User created successfully');

        // Update local state
        setUsers([...users, data]);
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('User deleted successfully');

      // Update local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users in the company including their name, role, and PIN.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add User
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex items-center bg-gray-50">
          <Users className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">Users</h3>
        </div>
        <div className="border-t border-gray-200 divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                  <p className="text-sm text-gray-500">Role: {user.role}</p>
                  {user.salary !== null && (
                    <p className="text-sm text-gray-500">
                      Salary: ₹{Number(user.salary).toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="inline-flex items-center p-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter employee's full name"
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-4 py-3"
              />
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN * (4-6 digits) {editingUser && `(Current PIN: ${editingUser.pin})`}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="pin"
                  id="pin"
                  required={!editingUser}
                  readOnly
                  maxLength={6}
                  value={formData.pin}
                  className="mt-1 block w-full rounded-lg text-2xl tracking-widest text-center border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={editingUser ? editingUser.pin : "••••••"}
                />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.pin.length < 6) {
                          if ('vibrate' in navigator) {
                            navigator.vibrate(50);
                          }
                          setFormData(prev => ({
                            ...prev,
                            pin: prev.pin + num.toString()
                          }));
                        }
                      }}
                      className="p-4 text-xl font-semibold bg-white border border-gray-200 rounded-xl text-gray-900 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                    >
                      {num}
                    </button>
                  ))}



                  <button
                type="button"
                onClick={() => {
                  if (formData.pin.length < 6) {
                    if ('vibrate' in navigator) {
                      navigator.vibrate(50);
                    }
                    setFormData(prev => ({
                      ...prev,
                      pin: prev.pin + '0'
                    }));
                  }
                }}
                className="p-4 text-xl font-semibold bg-white border border-gray-200 rounded-xl text-gray-900 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
              >
                0
              </button>
                  <button
                    type="button"
                    onClick={() => {
                      if ('vibrate' in navigator) {
                        navigator.vibrate(50);
                      }
                      setFormData(prev => ({
                        ...prev,
                        pin: prev.pin.slice(0, -1)
                      }));
                    }}
                    className="p-4 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-900 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-4 py-3"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                Salary (Optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="salary"
                  id="salary"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-7 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base px-4 py-3"
                  placeholder="Enter monthly salary amount"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-5">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(false);
              }}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}