import { Link, useLocation } from 'react-router-dom';
import { Home, History, BarChart3, Target, User } from 'lucide-react';

const navItems = [
  { path: '/',          icon: Home,     label: 'Home' },
  { path: '/history',   icon: History,  label: 'History' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/budget',    icon: Target,   label: 'Budget' },
  { path: '/profile',   icon: User,     label: 'Profile' },
];

const SimpleBottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xl border-t border-gray-100/80 dark:border-gray-800/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="nav-item flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl"
            >
              <div className="relative flex items-center justify-center">
                {/* Active background pill */}
                <span
                  className={`absolute inset-0 rounded-xl transition-all duration-250 ease-spring ${
                    active
                      ? 'bg-[#e0f2fe] dark:bg-[#0c4a6e]/50 scale-100 opacity-100'
                      : 'scale-75 opacity-0'
                  }`}
                  style={{ padding: '6px 10px' }}
                />
                <span className={`relative p-1.5 rounded-xl transition-colors duration-180 ${
                  active ? 'text-[#0ea5e9]' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                </span>
              </div>
              <span className={`text-[10px] font-semibold transition-colors duration-180 ${
                active ? 'text-[#0ea5e9]' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default SimpleBottomNav;
