'use client';
import { useState, useEffect } from 'react';

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
  activeSelection: 'checkIn' | 'checkOut';
  setActiveSelection: (sel: 'checkIn' | 'checkOut') => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DateRangePicker({ checkIn, checkOut, onChange, onClose, activeSelection, setActiveSelection }: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localIn, setLocalIn] = useState<string>(checkIn || '');
  const [localOut, setLocalOut] = useState<string>(checkOut || '');
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let safeIn = checkIn || '';
    let safeOut = checkOut || '';
    if (safeIn && safeIn < todayStr) {
      safeIn = todayStr;
      const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      safeOut = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
      onChange(safeIn, safeOut);
    }
    setLocalIn(safeIn);
    setLocalOut(safeOut);
    if (safeIn) {
      const parts = safeIn.split('-').map(Number);
      if (parts.length === 3) {
        setCurrentMonth(new Date(parts[0], parts[1] - 1, 1));
      }
    }
  }, [checkIn, checkOut]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseLocal = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDateStr = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getNextDayStr = (d: Date) => {
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return formatDateStr(next);
  };

  const formatShort = (dateStr: string) => {
    if (!dateStr) return '';
    const d = parseLocal(dateStr);
    if (!d) return '';
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  };

  const checkInDate = parseLocal(localIn);
  const checkOutDate = parseLocal(localOut);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateStr(date);

    // If user explicitly clicked Check-Out input in the search bar:
    if (activeSelection === 'checkOut' && localIn) {
      const inDate = parseLocal(localIn);
      // Check-out must be at least 1 day after check-in (same-day booking not allowed)
      if (inDate && date.getTime() > inDate.getTime()) {
        setLocalOut(dateStr);
        onChange(localIn, dateStr);
        onClose();
        return;
      }
      // If user clicked same date or prior date, restart with new check-in
      setLocalIn(dateStr);
      setLocalOut('');
      setActiveSelection('checkOut');
      return;
    }

    // Default flow: selecting Check-In date
    // Only select check-in date. DO NOT auto-select checkout so user has freedom to choose any checkout date.
    setLocalIn(dateStr);
    setLocalOut('');
    setActiveSelection('checkOut');
  };

  const handleConfirm = () => {
    if (localIn && localOut && localIn < localOut) {
      onChange(localIn, localOut);
      onClose();
    } else if (localIn) {
      const fallbackOut = getNextDayStr(parseLocal(localIn)!);
      onChange(localIn, fallbackOut);
      onClose();
    } else {
      onClose();
    }
  };

  const renderMonth = (offset: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + offset;
    const date = new Date(year, month, 1);
    
    const monthName = MONTHS[date.getMonth()];
    const displayYear = date.getFullYear();

    const daysInMonth = new Date(displayYear, date.getMonth() + 1, 0).getDate();
    const firstDayIndex = date.getDay();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(displayYear, date.getMonth(), i));
    }

    return (
      <div style={{ flex: 1, minWidth: 280 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--brand-500)', opacity: (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth()) ? 0.3 : 1 }} disabled={currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth()}>
            {'<'}
          </button>
          
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{monthName} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{displayYear}</span></div>
          
          <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--brand-500)' }}>
            {'>'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8 }}>
          {DAYS.map(day => (
            <div key={day} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{day}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px 0' }}>
          {days.map((day, i) => {
            if (!day) return <div key={i} />;

            const isPast = day < today;
            const isCheckIn = !isPast && Boolean(checkInDate && day.getTime() === checkInDate.getTime());
            const isCheckOut = !isPast && Boolean(checkOutDate && day.getTime() === checkOutDate.getTime());
            
            // Preview range while hovering
            const isHoverRange = Boolean(
              !isPast &&
              checkInDate && !checkOutDate && hoverDate && hoverDate > checkInDate &&
              day > checkInDate && day < hoverDate
            );
            const isBetween = Boolean(!isPast && checkInDate && checkOutDate && day > checkInDate && day < checkOutDate);
            const isSelected = isCheckIn || isCheckOut;

            let bg = 'transparent';
            let color = 'var(--text-primary)';
            let borderRadius = 'var(--radius-md)';
            let fontWeight = 600;

            if (isPast) {
              color = 'var(--text-muted)';
              fontWeight = 400;
            } else if (isSelected) {
              bg = 'var(--brand-500)';
              color = 'white';
            } else if (isBetween) {
              bg = 'var(--brand-50)';
              color = 'var(--brand-700)';
              borderRadius = '0';
            } else if (isHoverRange) {
              bg = '#fff7ed';
              color = '#ea580c';
              borderRadius = '0';
            }

            if (isCheckIn && (checkOutDate || isHoverRange)) {
              borderRadius = 'var(--radius-md) 0 0 var(--radius-md)';
            } else if (isCheckOut && checkInDate) {
              borderRadius = '0 var(--radius-md) var(--radius-md) 0';
            }

            return (
              <button
                type="button"
                key={i}
                disabled={isPast}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDateClick(day); }}
                onMouseEnter={() => { if (!isPast) setHoverDate(day); }}
                style={{
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: bg,
                  color,
                  borderRadius,
                  border: 'none',
                  fontWeight,
                  fontSize: '0.95rem',
                  cursor: isPast ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  opacity: isPast ? 0.4 : 1,
                  transition: 'background 0.15s ease'
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: 'max-content',
        maxWidth: '100%',
        cursor: 'default',
        padding: '16px 20px'
      }}
      onClick={e => e.stopPropagation()}
      onMouseLeave={() => setHoverDate(null)}
    >
      {/* Step guidance banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: '14px',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 700, color: '#c2410c' }}>
          <span>🗓️</span>
          <span>
            {!localIn
              ? 'Select Check-in Date'
              : !localOut
              ? `Check-in: ${formatShort(localIn)} — Now select Check-out Date`
              : `${formatShort(localIn)} → ${formatShort(localOut)}`}
          </span>
        </div>
        {localIn && (
          <button
            type="button"
            onClick={() => {
              setLocalIn('');
              setLocalOut('');
              setActiveSelection('checkIn');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9a3412',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Reset
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 40 }}>
        {renderMonth(0)}
      </div>

      {/* Done / Confirm Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="btn btn-primary"
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
          disabled={!localIn}
        >
          {localOut ? 'Done' : 'Select Dates'}
        </button>
      </div>
    </div>
  );
}
