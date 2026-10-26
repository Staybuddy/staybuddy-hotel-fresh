'use client';

import Link from 'next/link';

export default function AgreementPrintBtn() {
  return (
    <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
      <button 
        type="button"
        onClick={() => window.print()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '14px 28px',
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
          transition: 'all 0.2s',
        }}
      >
        <span>🖨️</span> Print / Save as PDF
      </button>

      <Link
        href="/partner"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '14px 24px',
          background: '#f1f5f9',
          color: '#334155',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'all 0.2s',
        }}
      >
        <span>←</span> Partner Extranet
      </Link>
    </div>
  );
}
