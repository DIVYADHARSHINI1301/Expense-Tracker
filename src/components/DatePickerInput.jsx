import { useRef } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatDateDDMMYYYY, formatTime12Hour } from '../utils/dateUtils';

export default function DatePickerInput({
  date,
  time,
  onDateChange,
  onTimeChange,
  accent = '#4a9eff',
  includeTime = true,
  className = '',
}) {
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  const formattedDate = formatDateDDMMYYYY(date) || 'DD/MM/YYYY';
  const formattedTime = formatTime12Hour(time) || '12:00 PM';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between px-0.5">
        <label className="text-[10px] font-bold text-[#8a9bb0] uppercase tracking-wider flex items-center gap-1">
          <span>Date & Time</span>
          <span className="text-[9px] text-[#4a9eff] font-semibold lowercase">(dd/mm/yyyy)</span>
        </label>
        {includeTime && (
          <span className="text-[10px] font-medium text-[#8a9bb0]">
            {formattedTime}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Date Selector in DD/MM/YYYY */}
        <div
          onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
          className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] cursor-pointer hover:border-[#cbd5e1] dark:hover:border-[#334155] transition-all group"
        >
          <Calendar className="w-3.5 h-3.5 text-[#8a9bb0] group-hover:text-[#4a9eff] transition-colors flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#2d3748] dark:text-[#c8d8e8] tracking-wide">
              {formattedDate}
            </p>
          </div>
          {/* Hidden native input for reliable touch and device picker */}
          <input
            ref={dateInputRef}
            type="date"
            value={date ? date.split('T')[0] : ''}
            onChange={(e) => onDateChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          />
        </div>

        {/* Time Selector */}
        {includeTime ? (
          <div
            onClick={() => timeInputRef.current?.showPicker ? timeInputRef.current.showPicker() : timeInputRef.current?.focus()}
            className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#1a2332] border border-[#e8ecf0] dark:border-[#1e2a38] cursor-pointer hover:border-[#cbd5e1] dark:hover:border-[#334155] transition-all group"
          >
            <Clock className="w-3.5 h-3.5 text-[#8a9bb0] group-hover:text-[#4a9eff] transition-colors flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#2d3748] dark:text-[#c8d8e8] tracking-wide">
                {formattedTime}
              </p>
            </div>
            <input
              ref={timeInputRef}
              type="time"
              value={time || ''}
              onChange={(e) => onTimeChange(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
