/* GlowLoader.jsx — Expensio branded loader */
const GlowLoader = ({ label = 'Loading...' }) => (
  <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
    style={{ background: '#0a1120' }}>

    {/* Ambient glow blobs */}
    <div className="absolute w-64 h-64 rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(74,158,255,0.12) 0%, transparent 70%)', top: '20%', left: '50%', transform: 'translateX(-50%)' }} />
    <div className="absolute w-48 h-48 rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(78,222,128,0.08) 0%, transparent 70%)', bottom: '25%', left: '30%' }} />

    {/* Logo mark */}
    <div className="relative mb-5 core-glow" style={{ width: 72, height: 72 }}>
      <div className="w-full h-full rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a2d45, #0f1e30)', border: '1.5px solid rgba(74,158,255,0.25)', boxShadow: '0 0 32px rgba(74,158,255,0.2)' }}>
        <svg viewBox="0 0 512 512" width="44" height="44">
          <defs>
            <linearGradient id="eg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4a9eff"/>
              <stop offset="100%" stopColor="#4ade80"/>
            </linearGradient>
          </defs>
          <rect x="130" y="118" width="58" height="276" rx="18" fill="url(#eg)"/>
          <rect x="130" y="118" width="240" height="58" rx="18" fill="url(#eg)"/>
          <rect x="130" y="227" width="190" height="52" rx="16" fill="url(#eg)"/>
          <rect x="130" y="336" width="240" height="58" rx="18" fill="url(#eg)"/>
        </svg>
      </div>
    </div>

    {/* Brand name */}
    <div className="flex items-baseline gap-0.5 mb-1">
      <span className="text-2xl font-black tracking-tight" style={{ color: '#4a9eff', fontFamily: 'inherit' }}>Expens</span>
      <span className="text-2xl font-black tracking-tight" style={{ color: '#4ade80' }}>io</span>
    </div>

    {/* Tagline */}
    <p className="text-xs font-medium mb-6" style={{ color: 'rgba(138,155,176,0.7)', letterSpacing: '0.12em' }}>
      {label}
    </p>

    {/* Scan bar */}
    <div className="relative w-32 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(74,158,255,0.12)' }}>
      <div className="scan-line absolute left-0 right-0 h-full rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, #4a9eff, #4ade80, transparent)' }} />
    </div>

    {/* Wave dots */}
    <div className="flex items-end gap-1 mt-4" style={{ height: 16 }}>
      {[0,1,2,3].map(i => (
        <div key={i} className="dot-wave w-1 rounded-full"
          style={{ height: 12, background: i % 2 === 0 ? '#4a9eff' : '#4ade80', animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  </div>
);

export default GlowLoader;
