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
  
  useEffect(() => {
    if (checkIn) {
      setCurrentMonth(new Date(checkIn));
    } else {
      setCurrentMonth(new Date());
    }
  }, [checkIn]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseLocal = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    // Fallback for full ISO strings if any
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const checkInDate = parseLocal(checkIn);
  const checkOutDate = parseLocal(checkOut);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (activeSelection === 'checkIn') {
      if (checkOutDate && date > checkOutDate) {
        onChange(dateStr, '');
      } else {
        onChange(dateStr, checkOut);
      }
      setActiveSelection('checkOut');
    } else {
      if (checkInDate && date < checkInDate) {
        onChange(dateStr, '');
        setActiveSelection('checkOut');
      } else {
        onChange(checkIn, dateStr);
        onClose(); // Auto close on successful checkout selection
      }
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
          {offset === 0 ? (
            <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--brand-500)' }} disabled={currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth()}>
              {'<'}
            </button>
          ) : <div style={{ width: 24 }} />}
          
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{monthName} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{displayYear}</span></div>
          
          {offset === 1 ? (
            <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--brand-500)' }}>
              {'>'}
            </button>
          ) : <div style={{ width: 24 }} />}
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
            const isCheckIn = checkInDate && day.getTime() === checkInDate.getTime();
            const isCheckOut = checkOutDate && day.getTime() === checkOutDate.getTime();
            const isBetween = checkInDate && checkOutDate && day > checkInDate && day < checkOutDate;
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
            }

            if (isCheckIn && checkOutDate) {
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
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => {
                  if (!isPast && !isSelected) {
                    (e.currentTarget as HTMLElement).style.background = isBetween ? 'var(--brand-100)' : '#f1f5f9';
                  }
                }}
                onMouseLeave={e => {
                  if (!isPast && !isSelected) {
                    (e.currentTarget as HTMLElement).style.background = isBetween ? 'var(--brand-50)' : 'transparent';
                  }
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
        display: 'flex', gap: 40, width: 'max-content',
        cursor: 'default',
        padding: '8px'
      }}
      onClick={e => e.stopPropagation()} // Prevent closing when clicking inside picker
    >
      {renderMonth(0)}
      <div style={{ width: 1, background: 'var(--border)' }} />
      {renderMonth(1)}
    </div>
  );
}
