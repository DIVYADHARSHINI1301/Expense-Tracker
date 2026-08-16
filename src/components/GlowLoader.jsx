/* GlowLoader.jsx — spectacular loading screen */
const DOTS = [0, 1, 2, 3];

const GlowLoader = ({ label = 'Loading...' }) => (
  <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#f0f9ff] dark:bg-[#060f1a] overflow-hidden">

    {/* ── Hex background tiles ── */}
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute hex-spin pointer-events-none select-none"
        style={{
          width: `${80 + i * 40}px`,
          height: `${80 + i * 40}px`,
          border: `1.5px solid rgba(14,165,233,${0.06 + i * 0.02})`,
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${4 + i}s`,
        }}
      />
    ))}

    {/* ── Expanding rings ── */}
    {[0, 0.6, 1.2].map((delay, i) => (
      <div
        key={i}
        className="absolute ring-expand rounded-full pointer-events-none"
        style={{
          width: 80, height: 80,
          border: '1.5px solid rgba(14,165,233,0.5)',
          animationDelay: `${delay}s`,
        }}
      />
    ))}

    {/* ── Orbital system ── */}
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>

      {/* Orbit track rings */}
      <div className="absolute rounded-full border border-sky-200/30 dark:border-sky-800/30" style={{ width: 80, height: 80 }} />
      <div className="absolute rounded-full border border-violet-200/20 dark:border-violet-800/20" style={{ width: 56, height: 56 }} />

      {/* Orbiting dot A — sky */}
      <div className="absolute orbit-a" style={{ width: 10, height: 10 }}>
        <div className="w-2.5 h-2.5 rounded-full bg-sky-400 glow-sky" />
      </div>

      {/* Orbiting dot B — violet */}
      <div className="absolute orbit-b" style={{ width: 8, height: 8 }}>
        <div className="w-2 h-2 rounded-full bg-violet-400 glow-violet" />
      </div>

      {/* Orbiting dot C — rose */}
      <div className="absolute orbit-c" style={{ width: 7, height: 7 }}>
        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 glow-rose" />
      </div>

      {/* Core */}
      <div className="core-glow w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center z-10">
        <div className="w-4 h-4 rounded-full bg-white/80" />
      </div>
    </div>

    {/* ── Scan line container ── */}
    <div className="relative mt-6 w-40 h-1 bg-sky-100 dark:bg-sky-900/40 rounded-full overflow-hidden">
      <div
        className="absolute left-0 right-0 h-full rounded-full bg-gradient-to-r from-transparent via-sky-400 to-transparent scan-line"
        style={{ top: 0 }}
      />
    </div>

    {/* ── Wave dots ── */}
    <div className="flex items-end gap-1 mt-4" style={{ height: 20 }}>
      {DOTS.map(i => (
        <div
          key={i}
          className="dot-wave w-1.5 rounded-full bg-sky-400"
          style={{
            height: 14,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>

    {/* ── Label ── */}
    <p className="load-text mt-3 text-[11px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest">
      {label}
    </p>
  </div>
);

export default GlowLoader;
