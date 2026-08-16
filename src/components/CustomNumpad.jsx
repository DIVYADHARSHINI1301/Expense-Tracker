import { useState } from 'react';
import { Delete, Check } from 'lucide-react';

const CustomNumpad = ({ value, onChange, onConfirm }) => {
  const handleNumberClick = (num) => {
    const newValue = value + num;
    onChange(newValue);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleDecimal = () => {
    if (!value.includes('.')) {
      onChange(value + '.');
    }
  };

  const buttons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', '00']
  ];

  return (
    <div className="w-full">
      {/* Amount Display */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">₹</span>
          <input
            type="text"
            value={value}
            readOnly
            className="flex-1 text-3xl font-bold bg-transparent outline-none text-gray-800 dark:text-gray-100"
            placeholder="0"
          />
        </div>
      </div>

      {/* Numpad Grid */}
      <div className="grid grid-cols-4 gap-3">
        {buttons.map((row, rowIndex) => (
          row.map((btn, btnIndex) => (
            <button
              key={`${rowIndex}-${btnIndex}`}
              onClick={() => handleNumberClick(btn)}
              className="h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
            >
              {btn}
            </button>
          ))
        ))}

        {/* Backspace Button */}
        <button
          onClick={handleBackspace}
          className="h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 active:scale-95 transition-all flex items-center justify-center"
        >
          <Delete className="w-6 h-6" />
        </button>

        {/* Plus Button */}
        <button
          className="h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-2xl font-bold hover:bg-purple-200 dark:hover:bg-purple-800/50 active:scale-95 transition-all"
        >
          +
        </button>

        {/* Minus Button */}
        <button
          className="h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-2xl font-bold hover:bg-purple-200 dark:hover:bg-purple-800/50 active:scale-95 transition-all"
        >
          -
        </button>

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          className="h-14 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all flex items-center justify-center shadow-lg"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CustomNumpad;
