import React from 'react';

const stats = [
  { label: 'Cities', value: '6+', icon: '🏙️', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Hotels', value: '4,000+', icon: '🏨', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Rooms', value: '15,000+', icon: '🛏️', color: '#10b981', bg: '#ecfdf5' },
  { label: 'Happy Customers', value: '500k+', icon: '🥰', color: '#ec4899', bg: '#fdf2f8' }
];

export default function HomeStatsSection() {
  return (
    <section className="container" style={{ margin: 'var(--space-6) auto' }}>
      <div style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            transition: 'transform 0.3s ease',
            cursor: 'default'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: stat.bg,
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '16px',
              boxShadow: `0 4px 12px ${stat.bg}`
            }}>
              {stat.icon}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
