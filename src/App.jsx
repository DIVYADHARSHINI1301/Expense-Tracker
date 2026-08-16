import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { SpaceProvider, useSpace } from './context/SpaceContext';
import { AccountsProvider, useAccounts } from './context/AccountsContext';

import PrivateRoute from './components/PrivateRoute';
import SpaceBottomNav from './components/SpaceBottomNav';

// Generic account dashboards
import GenericBankDashboard   from './components/GenericBankDashboard';
import GenericWalletDashboard from './components/GenericWalletDashboard';
import GenericGoldDashboard   from './components/GenericGoldDashboard';

// Generic account pages
import AccountAddIncome  from './components/AccountAddIncome';
import { AccountAddExpense } from './components/AccountAddExpense';
import AccountHistory    from './components/AccountHistory';
import { AccountBuyGold, AccountSellGold } from './components/AccountGoldForms';
import AccountGoldHistory from './components/AccountGoldHistory';
import GenericAnalytics   from './components/GenericAnalytics';
import GenericBudget      from './components/GenericBudget';

// Shared
import Profile from './components/Profile';
import Login   from './components/Login';
import Signup  from './components/Signup';

// ─── Space route sync — sets activeSpace from URL ─────────────────────────────
const SpaceRouteSync = () => {
  const location = useLocation();
  const { setActiveSpace } = useSpace();
  const { accounts } = useAccounts();

  useEffect(() => {
    const match = location.pathname.match(/^\/account\/([^/]+)/);
    if (match) {
      const id = match[1];
      if (accounts.find(a => a.id === id)) setActiveSpace(id);
    }
  }, [location.pathname, accounts]);

  return null;
};

// ─── Page transition ──────────────────────────────────────────────────────────
const PageTransition = ({ children, spaceKey }) => {
  const [phase, setPhase]       = useState('idle');
  const [displayed, setDisplayed] = useState(children);
  const prevKey = useRef(spaceKey);
  const t1 = useRef(null), t2 = useRef(null);

  useEffect(() => {
    if (spaceKey === prevKey.current) { setDisplayed(children); return; }
    setPhase('exit');
    clearTimeout(t1.current); clearTimeout(t2.current);
    t1.current = setTimeout(() => { setDisplayed(children); prevKey.current = spaceKey; setPhase('enter'); }, 160);
    t2.current = setTimeout(() => setPhase('idle'), 420);
    return () => { clearTimeout(t1.current); clearTimeout(t2.current); };
  }, [spaceKey]);

  useEffect(() => { if (spaceKey === prevKey.current) setDisplayed(children); }, [children]);

  const styles = {
    idle:  { opacity: 1, transform: 'scale(1) translateY(0)',       filter: 'blur(0px)',  transition: 'none' },
    exit:  { opacity: 0, transform: 'scale(0.86) translateY(14px)', filter: 'blur(8px)', transition: 'opacity 0.16s ease, transform 0.16s ease, filter 0.16s ease' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0)',       filter: 'blur(0px)',  transition: 'opacity 0.30s cubic-bezier(0.22,1,0.36,1), transform 0.30s cubic-bezier(0.22,1,0.36,1), filter 0.24s ease' },
  };

  return <div style={{ ...styles[phase], willChange: 'transform, opacity, filter' }}>{displayed}</div>;
};

// ─── Dynamic account dashboard resolver ──────────────────────────────────────
const AccountDashboard = ({ refreshTrigger }) => {
  const { accounts } = useAccounts();
  const location = useLocation();
  const match = location.pathname.match(/^\/account\/([^/]+)/);
  const accountId = match?.[1];
  const account = accounts.find(a => a.id === accountId);

  if (!account) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-sm">Account not found</p>
    </div>
  );

  if (account.type === 'wallet') return <GenericWalletDashboard account={account} refreshTrigger={refreshTrigger} />;
  if (account.type === 'gold')   return <GenericGoldDashboard   account={account} refreshTrigger={refreshTrigger} />;
  return <GenericBankDashboard account={account} refreshTrigger={refreshTrigger} />;
};

// ─── History router — picks gold or bank/wallet history based on account type ────────
const AccountHistoryRouter = ({ onUpdate }) => {
  const { accounts } = useAccounts();
  const location = useLocation();
  const match = location.pathname.match(/^\/account\/([^/]+)/);
  const account = accounts.find(a => a.id === match?.[1]);
  if (!account) return null;
  if (account.type === 'gold') return <AccountGoldHistory onUpdate={onUpdate} />;
  return <AccountHistory onUpdate={onUpdate} />;
};

// ─── Default redirect — go to first account ──────────────────────────────────
const DefaultRedirect = () => {
  const { accounts, loading } = useAccounts();
  const navigate = useNavigate();
  const { activeSpace } = useSpace();

  useEffect(() => {
    if (loading) return;
    if (accounts.length === 0) return; // stay on profile, don't redirect in a loop
    const target = accounts.find(a => a.id === activeSpace) || accounts[0];
    navigate(`/account/${target.id}`, { replace: true });
  }, [accounts, loading, activeSpace]);

  // Show a friendly empty state while waiting / no accounts
  if (loading) return null;
  if (accounts.length === 0) return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0d1117] flex flex-col items-center justify-center px-6 gap-6">
      <div className="w-20 h-20 rounded-3xl bg-[#1a2332] flex items-center justify-center shadow-xl">
        <svg viewBox="0 0 512 512" width="52" height="52">
          <defs>
            <linearGradient id="el" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4a9eff"/><stop offset="100%" stopColor="#4ade80"/>
            </linearGradient>
          </defs>
          <rect x="130" y="118" width="58" height="276" rx="18" fill="url(#el)"/>
          <rect x="130" y="118" width="240" height="58" rx="18" fill="url(#el)"/>
          <rect x="130" y="227" width="190" height="52" rx="16" fill="url(#el)"/>
          <rect x="130" y="336" width="240" height="58" rx="18" fill="url(#el)"/>
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-[#1a2332] dark:text-white text-xl font-black mb-2">Welcome to Expensio</h2>
        <p className="text-[#6b7a8d] text-sm">Add your first account to get started</p>
      </div>
      <button onClick={() => navigate('/profile?tab=accounts')}
        className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #4a9eff, #38bdf8)' }}>
        + Add Account
      </button>
    </div>
  );

  return null;
};

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const { activeSpace } = useSpace();
  const handleUpdate = () => setRefreshTrigger(p => p + 1);
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  const routes = (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

      {/* Default → redirect to first account */}
      <Route path="/" element={<PrivateRoute><DefaultRedirect /></PrivateRoute>} />

      {/* Dynamic account routes */}
      <Route path="/account/:accountId"             element={<PrivateRoute><AccountDashboard refreshTrigger={refreshTrigger} /></PrivateRoute>} />
      <Route path="/account/:accountId/add-income"  element={<PrivateRoute><AccountAddIncome  onUpdate={handleUpdate} /></PrivateRoute>} />
      <Route path="/account/:accountId/add-expense" element={<PrivateRoute><AccountAddExpense onUpdate={handleUpdate} /></PrivateRoute>} />
      <Route path="/account/:accountId/history"     element={<PrivateRoute><AccountHistoryRouter onUpdate={handleUpdate} /></PrivateRoute>} />
      <Route path="/account/:accountId/analytics"  element={<PrivateRoute><GenericAnalytics /></PrivateRoute>} />
      <Route path="/account/:accountId/budget"     element={<PrivateRoute><GenericBudget onUpdate={handleUpdate} /></PrivateRoute>} />
      <Route path="/account/:accountId/buy"         element={<PrivateRoute><AccountBuyGold    onUpdate={handleUpdate} /></PrivateRoute>} />
      <Route path="/account/:accountId/sell"        element={<PrivateRoute><AccountSellGold   onUpdate={handleUpdate} /></PrivateRoute>} />
    </Routes>
  );

  return (
    <div className="min-h-screen bg-[#f0f9ff] dark:bg-[#0a1929]">
      <SpaceRouteSync />
      <div className={`w-full max-w-lg mx-auto relative ${!isAuthPage ? 'pb-40' : ''}`}>
        <PageTransition spaceKey={activeSpace}>
          {routes}
        </PageTransition>
      </div>
      {!isAuthPage && <SpaceBottomNav />}
    </div>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <AccountsProvider>
          <SpaceProvider>
            <Router>
              <AppShell />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: { background: '#fff', color: '#363636', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '14px', maxWidth: '90vw' },
                  success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                  error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
              />
            </Router>
          </SpaceProvider>
        </AccountsProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
