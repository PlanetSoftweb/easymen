import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Users, DollarSign, Receipt, Plus, Wallet, PlusCircle } from 'lucide-react';
import Modal from './Modal';
import ExpenseForm from './ExpenseForm';

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  if (!currentUser) {
    return <Outlet />;
  }

  const isAdmin = currentUser?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = isAdmin
    ? [
        { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin/expenses', icon: <Receipt size={20} />, label: 'Expenses' },
        { path: '/admin/users', icon: <Users size={20} />, label: 'Users' },
        { path: '/admin/balance', icon: <Wallet size={20} />, label: 'SmartSpend' },
      ]
    : [
        { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/expenses', icon: <Receipt size={20} />, label: 'My Expenses' },
        { path: '/credits', icon: <DollarSign size={20} />, label: 'My Credits' },
        { action: () => setIsExpenseModalOpen(true), icon: <Plus size={20} />, label: 'Add Expense' },
      ];

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar for larger screens */}
      <aside className={`hidden md:flex md:flex-col md:w-72 md:fixed md:inset-y-0 z-10 transition-all duration-300 ease-in-out`}>
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-r-[2rem] shadow-2xl backdrop-blur-lg border-r border-white/5">
          <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
            <div className="flex items-center justify-between flex-shrink-0 px-6 mb-6">
              <div className="flex items-center justify-between w-full">
              <h1 className="text-white text-2xl font-bold flex items-center gap-2">
                SmartSpend
                <span className="text-xs bg-white text-gray-900 px-2 py-0.5 rounded-full font-medium tracking-wider">BETA</span>
              </h1>
              <span className="text-white text-sm font-medium">{currentUser?.name || 'User'}</span>
            </div>
            </div>
            <nav className="mt-2 flex-1 px-4 space-y-2">
              {navItems.map((item) => (
                item.path ? (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${
                      location.pathname === item.path
                        ? 'bg-white text-gray-900'
                        : 'text-white hover:bg-white/10'
                    } group flex items-center px-5 py-3.5 text-sm font-medium rounded-xl transition-all duration-200`}
                  >
                    {item.icon}
                    <span className="ml-3.5 transition-all">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-white hover:bg-white/10 group flex items-center px-5 py-3.5 text-sm font-medium rounded-xl transition-all duration-200"
                  >
                    {item.icon}
                    <span className="ml-3.5 transition-all">{item.label}</span>
                  </button>
                )
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-white/10 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {currentUser.name.split(' ').map(name => name[0].toUpperCase() + name.slice(1)).join(' ')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <p className="text-xs font-medium text-gray-300 group-hover:text-white">
                      {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 flex items-center gap-2 bg-white text-red-600 py-2 px-4 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg w-full justify-center text-sm border border-red-200 hover:border-red-300"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden bg-gradient-to-r from-gray-900 to-black w-full flex items-center justify-between p-4 fixed top-0 z-20">
        <div className="flex flex-col">
          <h1 className="text-white text-xl font-bold">SmartSpend</h1>
          <span className="text-gray-400 text-xs">{currentUser.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-white p-2 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-gradient-to-t from-gray-900 to-black border border-white/10 flex z-10 rounded-2xl shadow-2xl backdrop-blur-lg overflow-hidden">
        {navItems.map((item) => (
          item.path ? (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-1 flex-col items-center justify-center py-4 ${
                location.pathname === item.path
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 active:scale-95 hover:text-white'
              } transition-all duration-200`}
            >
              {item.icon}
              <span className="text-xs mt-1.5 font-medium">{item.label}</span>
            </Link>
          ) : (
            <button
              key={item.label}
              onClick={item.action}
              className="flex flex-1 flex-col items-center justify-center py-4 text-gray-400 active:scale-95 hover:text-white transition-all duration-200"
            >
              {item.icon}
              <span className="text-xs mt-1.5 font-medium">{item.label}</span>
            </button>
          )
        ))}
      </div>

      {/* Main content */}
      <div className="md:pl-72 flex flex-col flex-1 bg-gradient-to-br from-white via-white to-blue-50">
        <main className="flex-1 pb-16 md:pb-0 mt-16 md:mt-0">
          <div className="py-6">
            <div className="max-w-full mx-auto px-4 sm:px-6 md:px-6 bg-white rounded-lg shadow-sm">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Add New Expense"
      >
        <ExpenseForm onSuccess={() => setIsExpenseModalOpen(false)} />
      </Modal>
    </div>
  );
}