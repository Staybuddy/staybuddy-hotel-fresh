"use client";
import React from 'react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      style={{ 
        backgroundColor: '#f97316', 
        color: 'white', 
        border: 'none', 
        padding: '12px 24px', 
        borderRadius: '8px', 
        fontSize: '1rem', 
        fontWeight: 600, 
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(249, 115, 22, 0.2)'
      }}
    >
      🖨️ Print Invoice
    </button>
  );
}
