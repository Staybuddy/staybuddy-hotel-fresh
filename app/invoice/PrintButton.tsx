"use client";
import React, { useState } from 'react';

export default function PrintButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <button 
      onClick={() => window.print()} 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        backgroundColor: hovered ? '#ea580c' : '#f97316', 
        color: 'white', 
        border: 'none', 
        padding: '10px 20px', 
        borderRadius: '8px', 
        fontSize: '0.95rem', 
        fontWeight: 700, 
        cursor: 'pointer',
        boxShadow: hovered ? '0 6px 12px rgba(234, 88, 12, 0.35)' : '0 4px 6px rgba(249, 115, 22, 0.25)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease-in-out',
        transform: hovered ? 'translateY(-1px)' : 'none'
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Print / Download PDF
    </button>
  );
}
