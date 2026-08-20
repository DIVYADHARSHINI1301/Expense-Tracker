import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
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
const AccountIcon = ({ type, logo, className }) => {
  if (logo) return (
    <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
  );
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

const PulseRing = ({ color }) => (
  <span className="absolute inset-0 rounded-full animate-space-pulse pointer-events-none"
    style={{ border: `2px solid ${color}`, opacity: 0 }} />
);

/* ─── Arc Carousel with Arc-Motion Swiping ───── */
const SpaceSwitcher = ({ accounts, activeId, onSwitch, onAdd }) => {
  const n = accounts.length;
  const activeIdx = accounts.findIndex(a => a.id === activeId);

  const [centerIdx, setCenterIdx] = useState(activeIdx === -1 ? 0 : activeIdx);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const idx = accounts.findIndex(a => a.id === activeId);
    if (idx !== -1) setCenterIdx(idx);
  }, [activeId, accounts]);

  const dragRef = useRef({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, velX: 0 });
  const rafRef  = useRef(null);
  const [burstId, setBurstId] = useState(null);
  const burstTimer = useRef(null);

  const mod = (i, m) => ((i % m) + m) % m;

  const shiftCenter = useCallback((dir) => {
    const next = mod(centerIdx + dir, n);
    setCenterIdx(next);
    setRotation(0);
    const acct = accounts[next];
    if (acct) {
      setBurstId(acct.id);
      clearTimeout(burstTimer.current);
      burstTimer.current = setTimeout(() => setBurstId(null), 600);
      onSwitch(acct);
    }
  }, [centerIdx, n, accounts, onSwitch]);

  const onPointerDown = (e) => {
    cancelAnimationFrame(rafRef.current);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = { active: true, startX: clientX, startY: clientY, lastX: clientX, lastY: clientY, velX: 0 };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current.velX = clientX - dragRef.current.lastX;
    dragRef.current.lastX = clientX;
    dragRef.current.lastY = clientY;
    
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    
    // Arc motion: horizontal drag maps to rotation
    // Left swipe (negative dx) = next, Right swipe (positive dx) = prev
    setRotation(dx / 80);
  };

  const onPointerUp = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const vel = dragRef.current.velX;
    const offset = rotation;

    if (Math.abs(offset) > 0.4 || Math.abs(vel) > 8) {
      // Swipe detected
      shiftCenter(offset < 0 ? 1 : -1);
    } else {
      // Snap back
      let cur = offset;
      const snap = () => {
        cur *= 0.75;
        setRotation(cur);
        if (Math.abs(cur) > 0.01) rafRef.current = requestAnimationFrame(snap);
        else setRotation(0);
      };
      rafRef.current = requestAnimationFrame(snap);
    }
  };

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(burstTimer.current);
  }, []);

  if (n === 0) return null;

  // Arc geometry: 3 items on upward dome curve
  const R = 75;  // arc radius
  const ANGLES = [-65, 0, 65];  // left, center, right on arc

  const getArcPos = (angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cx = Math.sin(rad) * R;
    const cy = R - Math.cos(rad) * R;  // upward dome: center lowest
    return { cx, cy };
  };

  const getSlotProps = (angleDeg) => {
    const absAngle = Math.abs(angleDeg);
    if (absAngle < 5) return { scale: 1.2, opacity: 1, zIndex: 10 };
    if (absAngle < 70) return { scale: 0.9, opacity: 0.8, zIndex: 5 };
    return { scale: 0.7, opacity: 0.4, zIndex: 2 };
  };

  // 3 visible items
  const leftIdx   = mod(centerIdx - 1, n);
  const rightIdx  = mod(centerIdx + 1, n);
  const slotItems = [
    { acct: accounts[leftIdx],  baseAngle: ANGLES[0] },
    { acct: accounts[centerIdx], baseAngle: ANGLES[1] },
    { acct: accounts[rightIdx], baseAngle: ANGLES[2] },
  ];

  const lerp = (a, b, t) => a + (b - a) * t;

  const getItemPos = (baseAngle) => {
    // During drag, interpolate angle smoothly
    const angle = baseAngle + rotation * 65;  // rotation maps to angle change
    const { cx, cy } = getArcPos(angle);
    const { scale, opacity, zIndex } = getSlotProps(angle);
    return { cx, cy, scale, opacity, zIndex };
  };

  return (
    <div
      className="relative flex justify-center items-start select-none"
      style={{ height: 130, touchAction: 'none' }}
      onMouseDown={onPointerDown} onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}   onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
    >
      {/* Arc guide curve - upward dome */}
      <svg
        className="absolute pointer-events-none"
        style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
        width="220" height="110" viewBox="0 0 220 110"
      >
        <path
          d="M 20 10 Q 110 100 200 10"
          fill="none"
          stroke="rgba(74,85,104,0.12)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>

      {slotItems.map(({ acct, baseAngle }) => {
        if (!acct) return null;
        const isCenter  = Math.abs(baseAngle) < 5;
        const isActive  = acct.id === activeId;
        const accent    = acct.accent || '#4a9eff';
        const { cx, cy, scale, opacity, zIndex } = getItemPos(baseAngle);
        const isDragging = dragRef.current.active;

        return (
          <button
            key={acct.id + '-' + baseAngle}
            onClick={() => {
              if (Math.abs(rotation) > 0.1) return;
              if (baseAngle < 0) shiftCenter(-1);
              else if (baseAngle > 0) shiftCenter(1);
              else if (isActive) return;
              else onSwitch(acct);
            }}
            className="absolute"
            style={{
              left: `calc(50% + ${cx}px - 24px)`,
              top: `calc(0px + ${cy}px)`,
              transform: `scale(${scale})`,
              opacity,
              transition: isDragging
                ? 'none'
                : 'left 0.45s cubic-bezier(0.22,1,0.36,1), top 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease',
              zIndex,
              willChange: 'transform, opacity',
            }}
          >
            {isActive && isCenter && (
              <span className="absolute rounded-full pointer-events-none"
                style={{ inset: -8, background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)`, filter: 'blur(6px)' }} />
            )}
            {isActive && isCenter && <PulseRing color={accent} />}
            {burstId === acct.id && isCenter && (
              <span className="absolute inset-0 rounded-full animate-burst-ring pointer-events-none"
                style={{ border: `2px solid ${accent}` }} />
            )}

            <span
              className="relative flex items-center justify-center w-12 h-12 rounded-full cursor-grab active:cursor-grabbing"
              style={{
                background: isActive && isCenter
                  ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
                  : 'rgba(26,35,50,0.95)',
                boxShadow: isActive && isCenter
                  ? `0 0 18px 4px ${accent}66, 0 4px 12px rgba(0,0,0,0.3)`
                  : '0 2px 8px rgba(0,0,0,0.25)',
                color: isActive && isCenter ? '#fff' : '#4a5568',
                border: isActive && isCenter ? 'none' : '1.5px solid #2a3a4e',
              }}
            >
              <AccountIcon type={acct.type} logo={acct.logo} className="w-4 h-4" />
            </span>

            <span
              className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap max-w-[60px] truncate"
              style={{
                bottom: -25,
                color: isActive && isCenter ? accent : '#4a5568',
                opacity: isCenter ? 1 : 0.5,
                textShadow: isActive && isCenter ? `0 0 8px ${accent}88` : 'none',
              }}
            >
              {acct.name}
            </span>
          </button>
        );
      })}

      <button
        onClick={onAdd}
        className="absolute flex items-center justify-center w-7 h-7 rounded-full active:scale-90 transition-transform"
        style={{
          right: 12, top: 8,
          background: 'rgba(20,30,43,0.9)',
          border: '1.5px dashed #3a4e62',
          color: '#4a5568',
          zIndex: 20,
        }}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
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
