import { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Calendar, LogOut, Edit2, Save, ArrowLeft, Trash2, AlertTriangle, Camera, Plus, X, Building2, Wallet, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { clearAllData } from '../firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAccounts, ACCOUNT_THEMES, ACCENT_PRESETS } from '../context/AccountsContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({ phone: '', dob: '' });
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'accounts' ? 'accounts' : 'profile');

  // Account management state
  const { accounts, addAccount, deleteAccount } = useAccounts();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAcct, setNewAcct] = useState({ name: '', type: 'bank', accent: '#4a9eff', logo: '' });
  const [addingAcct, setAddingAcct] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const logoRef = useRef();
  const [logoUploading, setLogoUploading] = useState(false);

  const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const initial = name.charAt(0).toUpperCase();

  // Load saved profile data from Firestore
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile')).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setProfileData({ phone: d.phone || '', dob: d.dob || '' });
        if (d.photoURL) setPhotoURL(d.photoURL);
      }
    });
  }, [currentUser]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        // Save to Firestore (base64 string)
        await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile'), {
          phone: profileData.phone,
          dob: profileData.dob,
          photoURL: base64,
        }, { merge: true });
        // Also update Firebase Auth profile (use a short placeholder if base64 too long)
        try {
          await updateProfile(currentUser, { photoURL: base64.substring(0, 1000) });
        } catch (_) { /* Auth photoURL has length limits, Firestore is source of truth */ }
        setPhotoURL(base64);
        toast.success('Photo updated!');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to upload photo');
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'profile'), {
        phone: profileData.phone,
        dob: profileData.dob,
        photoURL: photoURL,
      }, { merge: true });
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save'); }
  };

  const handleLogout = async () => {
    try { await logout(); toast.success('Logged out'); navigate('/login'); }
    catch { toast.error('Failed to logout'); }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await clearAllData(currentUser.uid);
      toast.success('All data cleared!');
      setShowClearModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch { toast.error('Failed to clear data'); }
    finally { setIsClearing(false); }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) { toast.error('Image must be under 1MB'); return; }
    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewAcct(p => ({ ...p, logo: ev.target.result }));
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddAccount = async () => {
    if (!newAcct.name.trim()) { toast.error('Enter account name'); return; }
    setAddingAcct(true);
    try {
      await addAccount(newAcct);
      toast.success(`${newAcct.name} added!`);
      setNewAcct({ name: '', type: 'bank', accent: '#4a9eff', logo: '' });
      setShowAddAccount(false);
    } catch { toast.error('Failed to add account'); }
    finally { setAddingAcct(false); }
  };

  const handleDeleteAccount = async (id) => {
    try {
      await deleteAccount(id);
      toast.success('Account removed');
      setDeleteConfirmId(null);
    } catch { toast.error('Failed to delete'); }
  };

  const TYPE_ICONS = { bank: Building2, wallet: Wallet, gold: Star };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1929] pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] dark:from-[#0c4a6e] dark:to-[#082f49] px-5 pt-8 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Profile</h1>
            <p className="text-sky-100 text-xs">Manage your account</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 5C120 10 240 20 360 23.3C480 27 600 23 720 21.7C840 20 960 20 1080 23.3C1200 27 1320 33 1380 36.7L1440 40V60H0V0Z" fill="currentColor" className="text-white dark:text-[#0a1929]"/>
          </svg>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-5 mt-4 relative z-10">
        <div className="flex bg-gray-100 dark:bg-[#1e293b] rounded-2xl p-1">
          {[['profile', 'Profile'], ['accounts', 'Accounts']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-white dark:bg-[#0a1929] text-[#0ea5e9] shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 relative z-10">
        {/* Avatar with upload */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center text-white text-4xl font-black shadow-xl border-4 border-white dark:border-[#0a1929] overflow-hidden">
              {photoURL
                ? <img src={photoURL} alt="avatar" className="w-full h-full object-cover" />
                : initial}
            </div>
            {/* Camera button */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0ea5e9] border-2 border-white dark:border-[#0a1929] flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-60"
            >
              {uploading
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-gray-900 dark:text-white text-xl font-bold">{name}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{currentUser?.email}</p>
        </div>

        {/* Info Cards */}
        <div className="space-y-3 mb-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] dark:bg-[#0c4a6e]/30 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#0ea5e9] font-semibold mb-0.5">Email</p>
              <p className="text-gray-800 dark:text-gray-100 font-semibold text-sm truncate">{currentUser?.email}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] dark:bg-[#0c4a6e]/30 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#0ea5e9] font-semibold mb-0.5">Phone</p>
              {editing ? (
                <input type="tel" value={profileData.phone}
                  onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm dark:text-white focus:border-[#0ea5e9] outline-none"
                  placeholder="Enter phone number" />
              ) : (
                <p className="text-gray-800 dark:text-gray-100 font-semibold text-sm">{profileData.phone || 'Not set'}</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] dark:bg-[#0c4a6e]/30 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#0ea5e9] font-semibold mb-0.5">Date of Birth</p>
              {editing ? (
                <input type="date" value={profileData.dob}
                  onChange={e => setProfileData(p => ({ ...p, dob: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm dark:text-white focus:border-[#0ea5e9] outline-none" />
              ) : (
                <p className="text-gray-800 dark:text-gray-100 font-semibold text-sm">{profileData.dob || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'profile' && (
          <>
            {/* Dark mode toggle */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
              <span className="text-gray-800 dark:text-gray-100 font-semibold text-sm">Dark Mode</span>
              <button onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-[#0ea5e9]' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {editing ? (
              <button onClick={handleSave}
                className="w-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mb-3">
                <Save className="w-5 h-5" /> Save Changes
              </button>
            ) : (
              <button onClick={() => setEditing(true)}
                className="touch-btn w-full bg-white dark:bg-[#1e293b] border-2 border-[#0ea5e9] text-[#0ea5e9] py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 mb-3">
                <Edit2 className="w-5 h-5" /> Edit Profile
              </button>
            )}

            <button onClick={handleLogout}
              className="touch-btn w-full bg-red-500 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg mb-3">
              <LogOut className="w-5 h-5" /> Logout
            </button>

            <button onClick={() => setShowClearModal(true)}
              className="touch-btn w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg">
              <Trash2 className="w-5 h-5" /> Clear All Data
            </button>
          </>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Your Accounts</p>

            {accounts.length === 0 && (
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 text-center border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No accounts yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Add your first account below</p>
              </div>
            )}

            {accounts.map(acct => {
              const TypeIcon = TYPE_ICONS[acct.type] || Building2;
              return (
                <div key={acct.id} className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 flex items-center gap-3 border border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: `${acct.accent}22` }}>
                    {acct.logo
                      ? <img src={acct.logo} alt={acct.name} className="w-full h-full object-cover" />
                      : <TypeIcon className="w-5 h-5" style={{ color: acct.accent }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{acct.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{ACCOUNT_THEMES[acct.type]?.label || acct.type}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: acct.accent }} />
                  {deleteConfirmId === acct.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDeleteAccount(acct.id)}
                        className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold active:scale-95">Delete</button>
                      <button onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold active:scale-95">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(acct.id)}
                      className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 active:scale-90 transition-transform">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add account button */}
            <button onClick={() => setShowAddAccount(true)}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#0ea5e9] text-[#0ea5e9] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              <Plus className="w-5 h-5" /> Add New Account
            </button>
          </div>
        )}
      </div>

      {/* Add Account Sheet */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddAccount(false)}>
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl w-full max-w-sm max-h-\[90vh\] overflow-y-auto shadow-2xl animate-pop-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900 dark:text-white text-base font-bold">Add New Account</h3>
              <button onClick={() => setShowAddAccount(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Logo upload (optional) */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Account Logo <span className="normal-case font-normal text-gray-400">(optional)</span></p>
              <div className="flex items-center gap-3">
                {/* Preview circle */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: newAcct.logo ? 'transparent' : `${newAcct.accent}22`, border: `2px solid ${newAcct.accent}44` }}>
                  {newAcct.logo
                    ? <img src={newAcct.logo} alt="logo" className="w-full h-full object-cover" />
                    : <span className="text-xl" style={{ color: newAcct.accent }}>
                        {newAcct.type === 'bank' ? '🏦' : newAcct.type === 'wallet' ? '👛' : '⭐'}
                      </span>}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    disabled={logoUploading}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
                    style={{ borderColor: `${newAcct.accent}66`, color: newAcct.accent }}>
                    {logoUploading
                      ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: newAcct.accent }} />Uploading...</>
                      : <><Camera className="w-4 h-4" />{newAcct.logo ? 'Change Logo' : 'Upload Logo'}</>}
                  </button>
                  {newAcct.logo && (
                    <button type="button" onClick={() => setNewAcct(p => ({ ...p, logo: '' }))}
                      className="w-full mt-1.5 py-1.5 rounded-xl text-xs font-semibold text-red-400 active:scale-95 transition-transform">
                      Remove
                    </button>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </div>

            {/* Account Name */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Account Name</p>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, PhonePe, Zerodha Gold"
                value={newAcct.name}
                onChange={e => setNewAcct(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:border-[#0ea5e9] outline-none transition-colors"
                autoFocus
              />
            </div>

            {/* Account Type */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Account Type</p>
              <div className="grid grid-cols-3 gap-2">
                {[['bank', Building2, 'Bank'], ['wallet', Wallet, 'Wallet'], ['gold', Star, 'Gold']].map(([type, Icon, label]) => (
                  <button key={type} onClick={() => setNewAcct(p => ({ ...p, type, accent: ACCOUNT_THEMES[type].accent }))}
                    className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                      newAcct.type === type
                        ? 'border-[#0ea5e9] bg-[#e0f2fe] dark:bg-[#0c4a6e]/30'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                    }`}>
                    <Icon className={`w-5 h-5 ${newAcct.type === type ? 'text-[#0ea5e9]' : 'text-gray-400'}`} />
                    <span className={`text-xs font-bold ${newAcct.type === type ? 'text-[#0ea5e9]' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Accent Color</p>
              {/* Swatches */}
              <div className="flex gap-2 flex-wrap mb-3">
                {ACCENT_PRESETS.map(color => (
                  <button key={color} onClick={() => setNewAcct(p => ({ ...p, accent: color }))}
                    className="w-8 h-8 rounded-full transition-all active:scale-90 flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      boxShadow: newAcct.accent === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
                      transform: newAcct.accent === color ? 'scale(1.18)' : 'scale(1)',
                    }} />
                ))}
              </div>
              {/* Free color picker */}
              <div className="flex items-center gap-3">
                <label className="relative cursor-pointer">
                  <div className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm"
                    style={{ backgroundColor: newAcct.accent }}>
                    <input type="color" value={newAcct.accent}
                      onChange={e => setNewAcct(p => ({ ...p, accent: e.target.value }))}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                  </div>
                </label>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Custom color</p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 uppercase">{newAcct.accent}</p>
                </div>
                {/* Live preview pill */}
                <div className="px-3 py-1.5 rounded-full text-white text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${newAcct.accent}, ${newAcct.accent}aa)` }}>
                  Preview
                </div>
              </div>
            </div>

            <button onClick={handleAddAccount} disabled={addingAcct}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
              style={{ backgroundColor: newAcct.accent }}>
              {addingAcct
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding...</>
                : <><Plus className="w-4 h-4" />Add Account</>}
            </button>
          </div>
        </div>
      )}

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowClearModal(false)}>
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-3xl">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center">Clear All Data?</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 text-center mb-4">This will permanently delete all expenses and income records.</p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowClearModal(false)} disabled={isClearing}
                  className="flex-1 px-6 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleClearAllData} disabled={isClearing}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {isClearing
                    ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Clearing...</>
                    : <><Trash2 className="w-5 h-5" />Yes, Delete All</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

