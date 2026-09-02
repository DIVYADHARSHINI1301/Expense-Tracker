// ─── Date & Time Utility Functions ──────────────────────────────────────────

/**
 * Format a date string, ISO string, or timestamp into DD/MM/YYYY
 * e.g., "2026-09-02" -> "02/09/2026"
 */
export const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

/**
 * Format time into 12-hour format with AM/PM (e.g., "02:30 PM" or "10:15 AM")
 */
export const formatTime12Hour = (timeOrDate) => {
  if (!timeOrDate) return '';
  
  // If time string like "14:30" or "02:30 PM"
  if (typeof timeOrDate === 'string') {
    if (timeOrDate.includes('AM') || timeOrDate.includes('PM')) {
      return timeOrDate;
    }
    const match = timeOrDate.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }
  }

  // If Date object or ISO string
  try {
    const d = new Date(timeOrDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
  } catch {}

  return '';
};

/**
 * Combined Date & Time display: "DD/MM/YYYY • hh:mm AM/PM"
 */
export const formatDateTime = (dateInput, explicitTime) => {
  const dateFormatted = formatDateDDMMYYYY(dateInput);
  const timeFormatted = explicitTime 
    ? formatTime12Hour(explicitTime) 
    : formatTime12Hour(dateInput);
  
  if (dateFormatted && timeFormatted) {
    return `${dateFormatted} • ${timeFormatted}`;
  }
  return dateFormatted || timeFormatted || '';
};

/**
 * Get current date in YYYY-MM-DD format (for input controls)
 */
export const getCurrentDateFormatted = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current time in HH:MM format (24-hour for input controls)
 */
export const getCurrentTimeFormatted = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Combine a date string ("YYYY-MM-DD") and time string ("HH:MM") into an ISO timestamp
 */
export const combineDateAndTime = (dateStr, timeStr) => {
  try {
    if (!dateStr) dateStr = getCurrentDateFormatted();
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    let hours = 12, minutes = 0;
    
    if (timeStr) {
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const parts = timeStr.trim().split(/[:\s]/);
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10) || 0;
        const ampm = parts[2]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      } else {
        const parts = timeStr.split(':').map(Number);
        hours = parts[0] || 0;
        minutes = parts[1] || 0;
      }
    } else {
      const now = new Date();
      hours = now.getHours();
      minutes = now.getMinutes();
    }
    
    const d = new Date(year, month - 1, day, hours, minutes, 0);
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

/**
 * Parse a transaction's timestamp for precise chronological sorting
 */
const getTxTimestamp = (tx) => {
  if (tx.date) {
    const d = new Date(tx.date);
    if (!isNaN(d.getTime())) {
      // If tx has explicit time and the date string didn't have hours
      if (tx.time && d.getHours() === 0 && d.getMinutes() === 0) {
        const match = tx.time.match(/^(\d{1,2}):(\d{2})/);
        if (match) {
          d.setHours(parseInt(match[1], 10), parseInt(match[2], 10));
        }
      }
      return d.getTime();
    }
  }
  if (tx.createdAt?.toDate) {
    return tx.createdAt.toDate().getTime();
  }
  if (tx.createdAt?.seconds) {
    return tx.createdAt.seconds * 1000;
  }
  return 0;
};

/**
 * Calculate chronological running balances for a list of transactions.
 * Transactions can be in any order; this will:
 * 1. Sort all transactions chronologically (oldest first).
 * 2. Calculate cumulative balance step-by-step (+income, -expense).
 * 3. Assign `runningBalance` to each item.
 * 4. Return the list with `runningBalance` populated.
 */
export const calculateRunningBalances = (transactions = []) => {
  if (!transactions || transactions.length === 0) return [];

  // Clone items to avoid mutating input directly
  const items = [...transactions];

  // Sort ascending by time (oldest first)
  items.sort((a, b) => {
    const timeA = getTxTimestamp(a);
    const timeB = getTxTimestamp(b);
    if (timeA !== timeB) return timeA - timeB;
    // Tie breaker if timestamps match
    return (a.id || '').localeCompare(b.id || '');
  });

  let currentBalance = 0;
  const balanceMap = new Map();

  items.forEach((tx) => {
    const amount = parseFloat(tx.amount || 0);
    const isIncome = tx.txType === 'income' || (!tx.txType && !tx.category);
    
    if (isIncome) {
      currentBalance += amount;
    } else {
      currentBalance -= amount;
    }
    
    balanceMap.set(tx.id || `${tx.title}-${tx.date}-${tx.amount}`, currentBalance);
  });

  // Return the original transactions array with runningBalance attached
  return transactions.map((tx) => {
    const key = tx.id || `${tx.title}-${tx.date}-${tx.amount}`;
    return {
      ...tx,
      runningBalance: balanceMap.has(key) ? balanceMap.get(key) : currentBalance,
    };
  });
};
