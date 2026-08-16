import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, History, BarChart3, Target, User, Plus, X } from 'lucide-react';
import { useSpace } from '../context/SpaceContext';
import { useAccounts } from '../context/AccountsContext';

/* ─── Nav items per account type ─────────────────────────── */
const navItemsForAccount = (account) => {
  const id = account.id;
  if (account.type === 'bank') {
    return [
      { path: `/account/${id}`,           icon: Home,     label: 'Home',      exact: true  },
      { path: `/account/${id}/history`,   icon: History,  label: 'History',   exact: false },
      { path: `/account/${id}/analytics`, icon: BarChart3,label: 'Analytics', exact: false },
      { path: `/account/${id}/budget`,    icon: Target,   label: 'Budget',    exact: false },
      { path: '/profile',                 icon: User,     label: 'Profile',   exact: false },
    ];
  }
  if (account.type === 'gold') {
    return [
      { path: `/account/${id}`,           icon: Home,     label: 'Home',    exact: true  },
      { path: `/account/${id}/history`,   icon: History,  label: 'History', exact: false },
      { path: '/profile',                 icon: User,     label: 'Profile', exact: false },
    ];
  }
  // wallet
  return [
    { path: `/account/${id}`,             icon: Home,     label: 'Home',      exact: true  },
    { path: `/account/${id}/history`,     icon: History,  label: 'History',   exact: false },
    { path: `/account/${id}/analytics`,   icon: BarChart3,label: 'Analytics', exact: false },
    { path: `/account/${id}/budget`,      icon: Target,   label: 'Budget',    exact: false },
    { path: '/profile',                   icon: User,     label: 'Profile',   exact: false },
  ];
};

/* ─── Icon SVGs per account type ─────────────────────────── */
const AccountIcon = ({ type, className }) => {
  if (type === 'wallet') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 12V8a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4"/>
      <path d="M20 12a2 2 0 00-2-2h-2a2 2 0 000 4h2a2 2 0 002-2z"/>
    </svg>
  );
  if (type === 'gold') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
  // bank (default)
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="8" width="18" height="13" rx="2"/>
      <path d="M3 10h18M7 15h.01M11 15h2"/>
      <path d="M8 8V6a4 4 0 018 0v2"/>
    </svg>
  );
};

/* ─── Arc positions for up to 3 visible circles ──────────── */
const ARC_OFFSETS = [
  { x: -76, yExtra: 0  },
  { x:   0, yExtra: 18 },
  { x:  76, yExtra: 0  },
];

const PulseRing = ({ color }) => (
  <span className="absolute inset-0 rounded-full animate-space-pulse pointer-events-none"
    style={{ border: `2px solid ${color}`, opacity: 0 }} />
);

/* ─── Arc Space Switcher ─────────────────────────────────── */
const SpaceSwitcher = ({ accounts, activeId, onSwitch, onAdd }) => {
  const [burstId, setBurstId] = useState(null);
  const burstTimer = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // First 3 accounts shown as arc circles; rest accessible via "+" picker
  const visible  = accounts.slice(0, 3);
  const overflow = accounts.slice(3);
  // Replace 3rd slot with "+" if there are overflow accounts
  const showPlus = overflow.length > 0;

  const handleClick = (account) => {
    if (account.id === activeId) return;
    setBurstId(account.id);
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurstId(null), 600);
    onSwitch(account);
  };

  useEffect(() => () => clearTimeout(burstTimer.current), []);

  // Build the 3 arc slots
  const slots = showPlus
    ? [...visible.slice(0, 2), null]   // null = "+" slot
    : visible;

  return (
    <>
      <div className="relative flex justify-center items-end h-16 pointer-events-none">
        {slots.map((account, i) => {
          const { x, yExtra } = ARC_OFFSETS[i] || ARC_OFFSETS[0];

          // "+" slot
          if (account === null) {
            return (
              <button key="plus" onClick={() => setPickerOpen(true)}
                className="absolute pointer-events-auto"
                style={{ bottom: 22 + yExtra, left: `calc(50% + ${x}px - 24px)`, zIndex: 5 }}>
                <span className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                  style={{ background: 'rgba(26,35,50,0.95)', border: '1.5px dashed #4a5568', color: '#4a5568' }}>
                  <Plus className="w-5 h-5" />
                </span>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap text-[#4a5568]">More</span>
              </button>
            );
          }

          const isActive = account.id === activeId;
          const accent   = account.accent || '#4a9eff';
          const bottomPx = 22 + (isActive ? 14 : 0) + yExtra;

          return (
            <button key={account.id} onClick={() => handleClick(account)}
              className="absolute pointer-events-auto"
              style={{
                bottom: bottomPx,
                left: `calc(50% + ${x}px - 24px)`,
                transition: 'bottom 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1)',
                transform: isActive ? 'scale(1.18)' : 'scale(1)',
                zIndex: isActive ? 10 : 5,
              }}>
              {isActive && (
                <span className="absolute rounded-full pointer-events-none"
                  style={{ inset: -6, background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)`, filter: 'blur(5px)' }} />
              )}
              {isActive && <PulseRing color={accent} />}
              {burstId === account.id && (
                <span className="absolute inset-0 rounded-full animate-burst-ring pointer-events-none"
                  style={{ border: `2px solid ${accent}` }} />
              )}
              <span className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                style={{
                  background: isActive ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : 'rgba(26,35,50,0.95)',
                  boxShadow: isActive ? `0 0 18px 4px ${accent}66, 0 4px 12px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.25)',
                  color: isActive ? '#fff' : '#4a5568',
                  border: isActive ? 'none' : '1.5px solid #2a3a4e',
                }}>
                <AccountIcon type={account.type} className="w-4 h-4" />
              </span>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap transition-all duration-300 max-w-[60px] truncate"
                style={{ color: isActive ? accent : '#4a5568', opacity: isActive ? 1 : 0.6 }}>
                {account.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Overflow picker sheet */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center"
          onClick={() => setPickerOpen(false)}>
          <div className="bg-[#1a2332] rounded-t-3xl w-full max-w-lg p-5 animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white text-sm font-bold">All Accounts</p>
              <button onClick={() => setPickerOpen(false)} className="w-7 h-7 rounded-full bg-[#2a3a4e] flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-[#8a9bb0]" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {accounts.map(account => {
                const isActive = account.id === activeId;
                const accent   = account.accent || '#4a9eff';
                return (
                  <button key={account.id} onClick={() => { onSwitch(account); setPickerOpen(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]"
                    style={{ background: isActive ? `${accent}22` : 'rgba(42,58,78,0.5)', border: isActive ? `1px solid ${accent}44` : '1px solid transparent' }}>
                    <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: isActive ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : 'rgba(26,35,50,0.95)', color: isActive ? '#fff' : '#4a5568' }}>
                      <AccountIcon type={account.type} className="w-4 h-4" />
                    </span>
                    <div className="flex-1 text-left">
                      <p className="text-white text-sm font-semibold">{account.name}</p>
                      <p className="text-[#8a9bb0] text-xs capitalize">{account.type}</p>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />}
                  </button>
                );
              })}
            </div>
            <button onClick={() => { setPickerOpen(false); onAdd(); }}
              className="w-full mt-3 py-3 rounded-xl border border-dashed border-[#4a5568] text-[#8a9bb0] text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              <Plus className="w-4 h-4" /> Add New Account
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── Main component ─────────────────────────────────────── */
const SpaceBottomNav = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { activeSpace, setActiveSpace } = useSpace();
  const { accounts } = useAccounts();

  // Resolve active account
  const activeAccount = accounts.find(a => a.id === activeSpace) || accounts[0];
  const accent = activeAccount?.accent || '#4a9eff';

  const navItems  = activeAccount ? navItemsForAccount(activeAccount) : [];
  const activeIdx = navItems.findIndex(item =>
    item.exact
      ? location.pathname === item.path
      : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );
  const safeIdx   = activeIdx === -1 ? 0 : activeIdx;

  const tabRefs   = useRef([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = tabRefs.current[safeIdx];
    if (el) setPillStyle({ left: el.offsetLeft, width: el.offsetWidth });
  }, [safeIdx, navItems.length, activeSpace]);

  const handleSpaceSwitch = (account) => {
    if (account.id === activeSpace) return;
    setActiveSpace(account.id);
    navigate(`/account/${account.id}`);
  };

  const handleAddAccount = () => navigate('/profile?tab=accounts');

  if (accounts.length === 0) {
    // Show minimal nav with just Profile when no accounts
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-4 mb-3">
          <nav className="relative flex items-center bg-[#1a2332] rounded-2xl overflow-hidden justify-center" style={{ height: 60 }}>
            <button onClick={() => navigate('/profile')}
              className="flex flex-col items-center justify-center gap-0.5 h-full px-8 transition-all active:scale-90">
              <User className="w-5 h-5 text-[#4a9eff]" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-[#4a9eff]">Profile</span>
            </button>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

      {/* Arc space switcher */}
      <SpaceSwitcher
        accounts={accounts}
        activeId={activeAccount?.id}
        onSwitch={handleSpaceSwitch}
        onAdd={handleAddAccount}
      />

      {/* Floating pill nav bar */}
      <div className="mx-4 mb-3">
        <nav className="relative flex items-center bg-[#1a2332] rounded-2xl overflow-hidden" style={{ height: 60 }}>
          {/* Sliding pill */}
          <span className="absolute top-2 bottom-2 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{ left: pillStyle.left + 4, width: pillStyle.width - 8, background: accent, opacity: 0.15 }} />
          {/* Top accent line */}
          <span className="absolute top-0 h-0.5 rounded-b-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{ left: pillStyle.left + pillStyle.width * 0.25, width: pillStyle.width * 0.5, background: accent }} />

          {navItems.map(({ path, icon: Icon, label }, i) => {
            const isActive = i === safeIdx;
            return (
              <button key={path} ref={el => (tabRefs.current[i] = el)} onClick={() => navigate(path)}
                className="relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-200 active:scale-90"
                style={{ minWidth: 0 }}>
                <span className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{ color: isActive ? accent : '#4a5568', transform: isActive ? 'scale(1.22) translateY(-1px)' : 'scale(1) translateY(0)', display: 'block' }}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span className="text-[9px] font-bold leading-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap overflow-hidden"
                  style={{ color: isActive ? accent : '#4a5568', maxHeight: isActive ? '14px' : '0px', opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(4px)' }}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default SpaceBottomNav;
