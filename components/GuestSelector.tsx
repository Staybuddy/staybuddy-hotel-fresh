'use client';

interface GuestSelectorProps {
  rooms: number;
  adults: number;
  children: number;
  onChange: (rooms: number, adults: number, children: number) => void;
  onClose: () => void;
}

const Stepper = ({ label, subLabel, value, field, min, onUpdate }: { label: string, subLabel?: string, value: number, field: 'rooms' | 'adults' | 'children', min: number, onUpdate: (f: 'rooms'|'adults'|'children', v: number) => void }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
    <div>
      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>{label}</div>
      {subLabel && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subLabel}</div>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
      <button 
        type="button"
        onClick={() => onUpdate(field, value - 1)}
        disabled={value <= min}
        style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: value <= min ? 'var(--border-hover)' : 'var(--text-secondary)', cursor: value <= min ? 'not-allowed' : 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        -
      </button>
      <span style={{ fontWeight: 700, width: 20, textAlign: 'center', fontSize: '1rem' }}>{value}</span>
      <button 
        type="button"
        onClick={() => onUpdate(field, value + 1)}
        style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-secondary)', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        +
      </button>
    </div>
  </div>
);

import { adjustRoomsAndAdults, MAX_ADULTS_PER_ROOM } from '@/lib/occupancyPricing';

export default function GuestSelector({ rooms, adults, children, onChange, onClose }: GuestSelectorProps) {
  
  const update = (field: 'rooms' | 'adults' | 'children', value: number) => {
    let r = rooms, a = adults, c = children;
    if (field === 'rooms' || field === 'adults') {
      const adjusted = adjustRoomsAndAdults(rooms, adults, field, value);
      r = adjusted.rooms;
      a = adjusted.adults;
    }
    if (field === 'children') c = Math.max(0, value);
    onChange(r, a, c);
  };

  return (
    <div 
      style={{
        width: 320,
        cursor: 'default',
        padding: '8px'
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Stepper label="Rooms" subLabel="Max 3 adults per room" value={rooms} field="rooms" min={1} onUpdate={update} />
        <div style={{ height: 1, background: 'var(--border)' }} />
        <Stepper label="Adults" subLabel={`Max ${rooms * MAX_ADULTS_PER_ROOM} for ${rooms} room${rooms > 1 ? 's' : ''}`} value={adults} field="adults" min={1} onUpdate={update} />
        <div style={{ height: 1, background: 'var(--border)' }} />
        <Stepper label="Children" subLabel="0 - 17 Years Old" value={children} field="children" min={0} onUpdate={update} />
      </div>

      <div style={{
        marginTop: 10,
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
        fontSize: '0.75rem',
        lineHeight: 1.3
      }}>
        💡 <strong>Occupancy rule:</strong> Max 3 adults per room. Adding more adults automatically adds required rooms.
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Done</button>
      </div>
    </div>
  );
}
