"use client";
import React, { useState } from 'react';

interface PrintButtonProps {
  invoiceNum?: string;
  targetId?: string;
}

export default function PrintButton({ 
  invoiceNum = 'Tax-Invoice', 
  targetId = 'tax-invoice-sheet' 
}: PrintButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [hoveredDownload, setHoveredDownload] = useState(false);
  const [hoveredPrint, setHoveredPrint] = useState(false);

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const element = document.getElementById(targetId);
      if (!element) {
        window.print();
        setDownloading(false);
        return;
      }

      // Dynamic import of PDF libraries to keep initial page bundle lightweight
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // Scroll to top for complete capture
      window.scrollTo(0, 0);

      // Render high-DPI canvas
      // onclone ensures that even on a mobile screen, the captured PDF is in pristine desktop A4 layout!
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById(targetId);
          if (el) {
            el.style.width = '840px';
            el.style.maxWidth = '840px';
            el.style.minWidth = '840px';
            el.style.padding = '36px 42px';
            el.style.boxSizing = 'border-box';

            const header = el.querySelector('.invoice-header-row') as HTMLElement;
            if (header) {
              header.style.flexDirection = 'row';
              header.style.alignItems = 'flex-start';
              header.style.justifyContent = 'space-between';
            }

            const headerRight = el.querySelector('.invoice-header-right') as HTMLElement;
            if (headerRight) {
              headerRight.style.textAlign = 'right';
            }

            const meta = el.querySelector('.invoice-meta-grid') as HTMLElement;
            if (meta) {
              meta.style.gridTemplateColumns = 'repeat(4, 1fr)';
            }

            const twoCol = el.querySelector('.invoice-two-col') as HTMLElement;
            if (twoCol) {
              twoCol.style.gridTemplateColumns = '1fr 1fr';
            }

            const tables = el.querySelectorAll('.invoice-table-scroll table');
            tables.forEach((t) => {
              (t as HTMLElement).style.width = '100%';
              (t as HTMLElement).style.minWidth = '100%';
            });

            const totals = el.querySelector('.invoice-totals-grid') as HTMLElement;
            if (totals) {
              totals.style.gridTemplateColumns = '1.25fr 1fr';
            }

            const footer = el.querySelector('.invoice-footer-row') as HTMLElement;
            if (footer) {
              footer.style.flexDirection = 'row';
              footer.style.alignItems = 'flex-end';
              footer.style.justifyContent = 'space-between';
            }

            const footerLeft = el.querySelector('.invoice-footer-left') as HTMLElement;
            if (footerLeft) {
              footerLeft.style.maxWidth = '62%';
            }

            const footerRight = el.querySelector('.invoice-footer-right') as HTMLElement;
            if (footerRight) {
              footerRight.style.width = '200px';
              footerRight.style.textAlign = 'center';
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4', // 210mm x 297mm
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 8; // 8mm outer margin for clean A4 framing
      const maxContentWidth = pdfWidth - (margin * 2); // 194mm
      const maxContentHeight = pdfHeight - (margin * 2); // 281mm

      // Compute scaled dimensions that fit within the printable A4 boundaries
      const imgRatio = canvas.width / canvas.height;
      let finalWidth = maxContentWidth;
      let finalHeight = finalWidth / imgRatio;

      if (finalHeight > maxContentHeight) {
        finalHeight = maxContentHeight;
        finalWidth = finalHeight * imgRatio;
      }

      // Center horizontally and vertically within the A4 page
      const xOffset = margin + (maxContentWidth - finalWidth) / 2;
      const yOffset = margin + (maxContentHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
      
      const safeInvoiceNum = String(invoiceNum).replace(/[^a-zA-Z0-9_-]/g, '') || 'Receipt';
      pdf.save(`StayBuddy-Tax-Invoice-${safeInvoiceNum}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Seamless fallback to browser print dialog
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {/* Primary: Direct A4 PDF Download */}
      <button 
        type="button"
        onClick={handleDownloadPDF}
        disabled={downloading}
        onMouseEnter={() => setHoveredDownload(true)}
        onMouseLeave={() => setHoveredDownload(false)}
        style={{ 
          backgroundColor: downloading ? '#94a3b8' : (hoveredDownload ? '#ea580c' : '#f97316'), 
          color: 'white', 
          border: 'none', 
          padding: '8px 16px', 
          borderRadius: '8px', 
          fontSize: '0.88rem', 
          fontWeight: 700, 
          cursor: downloading ? 'not-allowed' : 'pointer',
          boxShadow: hoveredDownload ? '0 6px 14px rgba(234, 88, 12, 0.4)' : '0 4px 6px rgba(249, 115, 22, 0.25)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease-in-out',
          transform: hoveredDownload && !downloading ? 'translateY(-1px)' : 'none'
        }}
        title="Download high-resolution A4 PDF directly fitted to page"
      >
        {downloading ? (
          <>
            <svg style={{ animation: 'spin 1s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download A4 PDF
          </>
        )}
      </button>

      {/* Secondary: Browser Print */}
      <button 
        type="button"
        onClick={() => window.print()}
        onMouseEnter={() => setHoveredPrint(true)}
        onMouseLeave={() => setHoveredPrint(false)}
        style={{ 
          backgroundColor: hoveredPrint ? '#f8fafc' : '#ffffff', 
          color: '#334155', 
          border: '1.5px solid #cbd5e1', 
          padding: '8px 14px', 
          borderRadius: '8px', 
          fontSize: '0.86rem', 
          fontWeight: 600, 
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease-in-out'
        }}
        title="Print invoice via browser print dialog"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Print
      </button>
    </div>
  );
}
