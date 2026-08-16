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
        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all bg-white dark:bg-gray-800 flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-500"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedMethod.color} flex items-center justify-center`}>
            <SelectedIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">{selectedMethod.name}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1e293b] border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="max-h-80 overflow-y-auto">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.name}
                  type="button"
                  onClick={() => handleSelect(method)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    value === method.name ? 'bg-[#0ea5e9]/10 dark:bg-[#0c4a6e]/30' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${method.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold ${
                      value === method.name 
                        ? 'text-[#0ea5e9] dark:text-[#38bdf8]' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {method.name}
                    </p>
                  </div>
                  {value === method.name && (
                    <div className="w-2 h-2 rounded-full bg-[#0ea5e9] dark:bg-[#38bdf8]"></div>
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
