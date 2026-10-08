'use client';

export default function AgreementPrintBtn() {
  return (
    <button 
      onClick={() => window.print()}
      style={{
        display: 'block',
        width: '100%',
        padding: '16px',
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1.1rem',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.4)',
      }}
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
