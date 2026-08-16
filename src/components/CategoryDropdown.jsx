import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import CategoryIcon from './CategoryIcons';

const CATEGORIES = [
  { name: 'Food', label: 'Food & Dining' },
  { name: 'Travel', label: 'Travel & Transport' },
  { name: 'Shopping', label: 'Shopping' },
  { name: 'Bills', label: 'Bills & Utilities' },
  { name: 'Entertainment', label: 'Entertainment' },
  { name: 'Education', label: 'Education' },
  { name: 'Health', label: 'Health & Fitness' },
  { name: 'Others', label: 'Others' }
];

const CategoryDropdown = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedCategory = CATEGORIES.find(cat => cat.name === value) || CATEGORIES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (category) => {
    onChange(category.name);
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] dark:from-[#075985] dark:to-[#0c4a6e] flex items-center justify-center">
            <CategoryIcon category={selectedCategory.name} className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">{selectedCategory.label}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1e293b] border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="max-h-80 overflow-y-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => handleSelect(category)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  value === category.name ? 'bg-[#0ea5e9]/10 dark:bg-[#0c4a6e]/30' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  value === category.name
                    ? 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] dark:from-[#0c4a6e] dark:to-[#082f49]'
                    : 'bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] dark:from-[#075985] dark:to-[#0c4a6e]'
                }`}>
                  <CategoryIcon category={category.name} className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-semibold ${
                    value === category.name 
                      ? 'text-[#0ea5e9] dark:text-[#38bdf8]' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {category.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{category.name}</p>
                </div>
                {value === category.name && (
                  <div className="w-2 h-2 rounded-full bg-[#0ea5e9] dark:bg-[#38bdf8]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
