import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Wallet, CreditCard, Smartphone, Building2 } from 'lucide-react';

const PAYMENT_METHODS = [
  { name: 'Cash', icon: Wallet, color: 'from-green-500 to-emerald-600' },
  { name: 'Card', icon: CreditCard, color: 'from-blue-500 to-indigo-600' },
  { name: 'UPI', icon: Smartphone, color: 'from-purple-500 to-pink-600' },
  { name: 'Net Banking', icon: Building2, color: 'from-orange-500 to-red-600' }
];

const PaymentDropdown = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedMethod = PAYMENT_METHODS.find(method => method.name === value) || PAYMENT_METHODS[0];
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

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 text-sm rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] text-[#2d3748] dark:text-[#c8d8e8] focus:outline-none transition-all flex items-center justify-between hover:border-[#d1d8e0] dark:hover:border-[#2a3a4e]"
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${selectedMethod.color} flex items-center justify-center flex-shrink-0`}>
            <SelectedIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-xs">{selectedMethod.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#8a9bb0] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Fixed positioning to avoid overlap */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-[9999] mt-2 bg-white dark:bg-[#161d27] border border-[#e8ecf0] dark:border-[#1e2a38] rounded-xl shadow-2xl overflow-hidden animate-fade-in"
          style={{ top: '100%' }}>
          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.name}
                  type="button"
                  onClick={() => handleSelect(method)}
                  className={`w-full px-3 py-3 flex items-center gap-3 rounded-lg hover:bg-[#f8fafc] dark:hover:bg-[#1a2332] transition-all duration-200 ${
                    value === method.name ? 'bg-[#f0f7ff] dark:bg-[#0f1923] border border-[#0ea5e9]/30' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${method.color} flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold text-sm ${
                      value === method.name 
                        ? 'text-[#0ea5e9] dark:text-[#38bdf8]' 
                        : 'text-[#2d3748] dark:text-[#c8d8e8]'
                    }`}>
                      {method.name}
                    </p>
                  </div>
                  {value === method.name && (
                    <div className="w-2 h-2 rounded-full bg-[#0ea5e9] dark:bg-[#38bdf8] animate-pulse flex-shrink-0"></div>
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
