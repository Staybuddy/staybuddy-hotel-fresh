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
      <style>{`
        .home-stats-card {
          background: white;
          border: 1.5px solid var(--border);
          borderRadius: 20px;
          padding: 20px 24px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }
        .home-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 10px 12px;
          border-radius: 14px;
          transition: transform 0.25s ease;
          cursor: default;
        }
        @media (max-width: 768px) {
          .home-stats-card {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory;
            gap: 10px;
            padding: 14px 16px !important;
            border-radius: 18px;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
          }
          .home-stats-card::-webkit-scrollbar {
            display: none;
          }
          .home-stat-item {
            flex: 0 0 130px !important;
            width: 130px !important;
            min-width: 130px !important;
            scroll-snap-align: start;
            padding: 8px 6px;
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
          }
        }
      `}</style>
      <div className="home-stats-card">
        {stats.map((stat, i) => (
          <div key={i} className="home-stat-item"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: stat.bg,
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              marginBottom: '8px',
              boxShadow: `0 4px 10px ${stat.bg}`
            }}>
              {stat.icon}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '2px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
