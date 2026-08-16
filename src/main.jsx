import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Remove splash after first paint
requestAnimationFrame(() => {
  setTimeout(() => {
    if (window.__removeSplash) window.__removeSplash()
  }, 900)
})

// Service Worker registration + update prompt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — show update banner
            showUpdateBanner(newWorker);
          }
        });
      });
    });

    // If a new SW just took control, reload once
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  });
}

function showUpdateBanner(worker) {
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.innerHTML = `
    <div style="
      position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
      background:#1a2332;border:1px solid #4a9eff44;
      color:#fff;padding:12px 18px;border-radius:16px;
      display:flex;align-items:center;gap:12px;
      font-family:'Inter',sans-serif;font-size:13px;
      box-shadow:0 8px 32px #0008;z-index:99999;
      animation:spFade 0.4s ease both;
      white-space:nowrap;
    ">
      <span style="color:#4a9eff;font-size:18px;">&#8635;</span>
      <span>New version available!</span>
      <button onclick="document.getElementById('update-banner').remove();" style="
        background:none;border:none;color:#8a9bb0;cursor:pointer;font-size:16px;padding:0 4px;
      ">&#x2715;</button>
      <button onclick="window.__swUpdate()" style="
        background:#4a9eff;border:none;color:#fff;cursor:pointer;
        padding:6px 14px;border-radius:8px;font-size:12px;font-weight:700;
      ">Update</button>
    </div>
  `;
  document.body.appendChild(banner);
  window.__swUpdate = () => { worker.postMessage({ type: 'SKIP_WAITING' }); };
}
