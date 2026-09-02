import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Wallet, CreditCard, Smartphone, Building2, ArrowLeftRight } from 'lucide-react';

const ALL_PAYMENT_METHODS = [
  { name: 'Cash',          icon: Wallet,         color: 'from-emerald-500 to-green-600',  types: ['wallet'] },
  { name: 'UPI',           icon: Smartphone,     color: 'from-purple-500 to-pink-600',    types: ['bank', 'gold'] },
  { name: 'Card',          icon: CreditCard,     color: 'from-blue-500 to-indigo-600',    types: ['bank', 'gold'] },
  { name: 'Net Banking',   icon: Building2,      color: 'from-orange-500 to-red-600',     types: ['bank', 'gold'] },
  { name: 'Bank Transfer', icon: ArrowLeftRight, color: 'from-cyan-500 to-blue-600',      types: ['bank', 'gold'] },
];

const PaymentDropdown = ({ value, onChange, accountType = 'bank', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filter methods based on accountType
  // Wallet: Only Cash
  // Bank / Non-wallet: NO Cash (UPI, Card, Net Banking, Bank Transfer)
  const isWallet = accountType === 'wallet';
  const availableMethods = ALL_PAYMENT_METHODS.filter(m => 
    isWallet ? m.types.includes('wallet') : m.types.includes('bank')
  );

  // Auto-correct value if current value is disallowed for account type
  useEffect(() => {
    const isAllowed = availableMethods.some(m => m.name === value);
    if (!isAllowed && availableMethods.length > 0) {
      onChange(availableMethods[0].name);
    }
  }, [accountType, value, availableMethods, onChange]);

  const selectedMethod = availableMethods.find(method => method.name === value) || availableMethods[0] || ALL_PAYMENT_METHODS[0];
  const SelectedIcon = selectedMethod.icon;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (method) => {
    onChange(method.name);
    setIsOpen(false);
  };

  // If wallet, only 1 mode (Cash), but still styled consistently
  const isLockedSingleOption = availableMethods.length <= 1;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        disabled={isLockedSingleOption}
        onClick={() => !isLockedSingleOption && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none transition-all flex items-center justify-between ${
          isLockedSingleOption ? 'opacity-90 cursor-default' : 'hover:border-[#d1d8e0] dark:hover:border-[#2a3a4e] cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${selectedMethod.color} flex items-center justify-center flex-shrink-0`}>
            <SelectedIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-xs block">{selectedMethod.name}</span>
            {isWallet && (
              <span className="text-[8px] text-emerald-500 font-bold block leading-none">Wallet (Cash Only)</span>
            )}
          </div>
        </div>
        {!isLockedSingleOption && (
          <ChevronDown className={`w-4 h-4 text-[#8a9bb0] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isLockedSingleOption && (
        <div className="absolute left-0 right-0 z-[9999] mt-2 bg-white dark:bg-[#161d27] border border-[#e8ecf0] dark:border-[#1e2a38] rounded-xl shadow-2xl overflow-hidden animate-fade-in"
          style={{ top: '100%' }}>
          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
            {availableMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = value === method.name;
              return (
                <button
                  key={method.name}
                  type="button"
                  onClick={() => handleSelect(method)}
                  className={`w-full px-3 py-2.5 flex items-center gap-3 rounded-lg hover:bg-[#f8fafc] dark:hover:bg-[#1a2332] transition-all duration-200 ${
                    isSelected ? 'bg-[#f0f7ff] dark:bg-[#0f1923] border border-[#0ea5e9]/30' : ''
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${method.color} flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold text-xs ${
                      isSelected 
                        ? 'text-[#0ea5e9] dark:text-[#38bdf8]' 
                        : 'text-[#2d3748] dark:text-[#c8d8e8]'
                    }`}>
                      {method.name}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[#0ea5e9] dark:bg-[#38bdf8] animate-pulse flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDropdown;
