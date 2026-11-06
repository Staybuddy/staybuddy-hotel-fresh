import React from 'react';

const stats = [
  { label: 'Cities', value: '6+', icon: '🏙️', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Hotels', value: '4,000+', icon: '🏨', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Rooms', value: '15,000+', icon: '🛏️', color: '#10b981', bg: '#ecfdf5' },
  { label: 'Happy Customers', value: '500k+', icon: '🥰', color: '#ec4899', bg: '#fdf2f8' }
];

export default function HomeStatsSection() {
  return (
    <section className="container" style={{ margin: '0 auto 22px' }}>
      <div style={{
        background: 'white',
        border: '1.5px solid var(--border)',
        borderRadius: '20px',
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            padding: '10px 12px',
            borderRadius: '14px',
            transition: 'transform 0.25s ease',
            cursor: 'default'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: stat.bg,
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '10px',
              boxShadow: `0 4px 10px ${stat.bg}`
            }}>
              {stat.icon}
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '2px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
