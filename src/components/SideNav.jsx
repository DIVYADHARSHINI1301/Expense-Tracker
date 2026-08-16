import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, History, BarChart3, Target, User, Menu, X, Wallet } from 'lucide-react';

const SideNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard', color: 'blue' },
    { path: '/add-income', icon: Plus, label: 'Add Income', color: 'green' },
    { path: '/add-expense', icon: Plus, label: 'Add Expense', color: 'red' },
    { path: '/history', icon: History, label: 'History', color: 'purple' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', color: 'indigo' },
    { path: '/budget', icon: Target, label: 'Budget', color: 'pink' },
    { path: '/profile', icon: User, label: 'Profile', color: 'orange' }
  ];

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-rose-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <>
      {/* Hamburger Button - Fixed Top Left */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[100] w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Navigation */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl z-[95] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">ExpenseTracker</h2>
                <p className="text-blue-100 text-xs">Manage your finances</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${colorClasses[item.color]} text-white shadow-lg scale-105`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-gray-700 dark:text-gray-300 text-xs font-semibold mb-1">💡 Pro Tip</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Track daily to stay on budget!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideNav;
