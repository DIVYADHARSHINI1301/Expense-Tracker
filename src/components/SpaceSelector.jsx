import { useRef } from 'react';
import { useSpace, SPACES } from '../context/SpaceContext';

const SPACE_CONFIG = [
  {
    id: SPACES.ESAF,
    label: 'ESAF Bank',
    shortLabel: 'ESAF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="8" width="18" height="13" rx="2"/>
        <path d="M3 10h18M7 15h.01M11 15h2"/>
        <path d="M8 8V6a4 4 0 018 0v2"/>
      </svg>
    ),
    gradient: 'from-[#0ea5e9] to-[#0284c7]',
    darkGradient: 'dark:from-[#0c4a6e] dark:to-[#082f49]',
    activeColor: 'text-[#0ea5e9]',
    activeBg: 'bg-[#0ea5e9]',
    pillBg: 'bg-[#e0f2fe] dark:bg-[#0c4a6e]/40',
  },
  {
    id: SPACES.WALLET,
    label: 'My Wallet',
    shortLabel: 'Wallet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20 12V8a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4"/>
        <path d="M20 12a2 2 0 00-2-2h-2a2 2 0 000 4h2a2 2 0 002-2z"/>
      </svg>
    ),
    gradient: 'from-violet-500 to-purple-600',
    darkGradient: 'dark:from-violet-800 dark:to-purple-900',
    activeColor: 'text-violet-500',
    activeBg: 'bg-violet-500',
    pillBg: 'bg-violet-50 dark:bg-violet-900/30',
  },
  {
    id: SPACES.GOLD,
    label: 'Aura Gold',
    shortLabel: 'Gold',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    gradient: 'from-amber-400 to-yellow-500',
    darkGradient: 'dark:from-amber-700 dark:to-yellow-800',
    activeColor: 'text-amber-500',
    activeBg: 'bg-amber-500',
    pillBg: 'bg-amber-50 dark:bg-amber-900/30',
  },
];

export { SPACE_CONFIG };

const SpaceSelector = () => {
  const { activeSpace, setActiveSpace } = useSpace();
  const activeIdx = SPACE_CONFIG.findIndex(s => s.id === activeSpace);

  return (
    <div className="relative flex items-center bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl p-1 shadow-lg border border-gray-100/80 dark:border-gray-700/50">
      {/* Sliding pill */}
      <div
        className="absolute top-1 bottom-1 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc(${100 / SPACE_CONFIG.length}% - 4px)`,
          left: `calc(${(activeIdx * 100) / SPACE_CONFIG.length}% + 4px)`,
          background: activeIdx === 0
            ? 'linear-gradient(135deg,#0ea5e9,#0284c7)'
            : activeIdx === 1
            ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)'
            : 'linear-gradient(135deg,#f59e0b,#d97706)',
          boxShadow: activeIdx === 0
            ? '0 4px 12px rgba(14,165,233,0.35)'
            : activeIdx === 1
            ? '0 4px 12px rgba(139,92,246,0.35)'
            : '0 4px 12px rgba(245,158,11,0.35)',
        }}
      />
      {SPACE_CONFIG.map((space, idx) => {
        const isActive = space.id === activeSpace;
        return (
          <button
            key={space.id}
            onClick={() => setActiveSpace(space.id)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all duration-200 ${
              isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
              {space.icon}
            </span>
            <span className="text-xs font-bold tracking-wide hidden sm:block">{space.label}</span>
            <span className="text-xs font-bold tracking-wide sm:hidden">{space.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SpaceSelector;
