import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, History, Target, Menu, X, Wallet, LogOut, BarChart3, Moon, Sun, ArrowLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/add-income', label: 'Add Income', icon: Plus },
    { path: '/add-expense', label: 'Add Expense', icon: Plus },
    { path: '/history', label: 'History', icon: History },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/budget', label: 'Budget', icon: Target }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('👋 Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getUserName = () => {
    return currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo and Back/Menu Button */}
          <div className="flex items-center gap-3">
            {/* Mobile: Show Back button on non-dashboard pages, Hamburger on dashboard */}
            <div className="md:hidden">
              {location.pathname === '/' ? (
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                >
                  {isOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/')}
                  className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
              )}
            </div>

            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ExpenseTracker
                </h1>
                <p className="text-xs text-gray-600 hidden md:block">Manage your finances</p>
              </div>
            </Link>
          </div>

          {/* Desktop Menu - Always visible */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
            
            {/* Desktop Profile Dropdown */}
            <div className="relative ml-4 pl-4 border-l border-gray-300" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 px-3 py-2 bg-white/50 rounded-xl hover:bg-white/70 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(getUserName())}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-bold text-gray-800">{getUserName()}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 glass rounded-2xl shadow-2xl py-2 z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-bold text-gray-800">{getUserName()}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDarkMode();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-left rounded-lg group"
                  >
                    <div className="relative w-5 h-5">
                      {darkMode ? (
                        <Sun className="w-5 h-5 text-yellow-500 group-hover:rotate-90 transition-transform duration-300" />
                      ) : (
                        <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Profile Avatar - Show on all pages */}
          <div className="md:hidden flex items-center gap-2" ref={profileRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setProfileOpen(!profileOpen);
              }}
              className="relative z-50"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg active:scale-95 transition-transform">
                {getInitials(getUserName())}
              </div>
            </button>

            {/* Mobile Profile Dropdown */}
            {profileOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/20 z-[60]" 
                  onClick={() => setProfileOpen(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="fixed right-4 top-16 w-72 glass rounded-2xl shadow-2xl py-2 z-[70] animate-scale-in border border-white/20">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{getUserName()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                  </div>
                  
                  <button
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleDarkMode();
                      setTimeout(() => setProfileOpen(false), 100);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-all duration-200 text-left group touch-manipulation"
                  >
                    <div className="relative w-6 h-6 flex-shrink-0">
                      {darkMode ? (
                        <Sun className="w-6 h-6 text-yellow-500 group-hover:rotate-90 transition-transform duration-300" />
                      ) : (
                        <Moon className="w-6 h-6 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
                      )}
                    </div>
                    <span className="text-base font-medium text-gray-700 dark:text-gray-200">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <button
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors text-left text-red-600 dark:text-red-400 touch-manipulation"
                  >
                    <LogOut className="w-6 h-6 flex-shrink-0" />
                    <span className="text-base font-medium">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

          {/* Mobile Menu Button - Removed from here, now in left side */}

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-slide-in">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
