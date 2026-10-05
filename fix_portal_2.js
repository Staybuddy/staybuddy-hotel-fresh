const fs = require('fs');
const path = './components/LocationSearch.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import { createPortal }")) {
    code = code.replace("import { useState, useEffect, useRef } from 'react';", "import { useState, useEffect, useRef } from 'react';\nimport { createPortal } from 'react-dom';");
}

code = code.replace(
    "const [isModalOpen, setIsModalOpen] = useState(false);",
    "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [mounted, setMounted] = useState(false);\n  useEffect(() => setMounted(true), []);"
);

// We need to replace the absolute dropdown with the portal one.
// Let's use regex or just replace the whole chunk.
const startStr = "{isModalOpen && (";
const endStr = "onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }} \n        />\n      )}";

const startIndex = code.indexOf(startStr);
if (startIndex !== -1) {
    // Find the end index
    const endIndex = code.lastIndexOf(")}");
    if (endIndex !== -1) {
        // Just slice out the whole modal logic and replace it
        code = code.substring(0, startIndex) + `
      {mounted && isModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsModalOpen(false)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '24px', width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Where do you want to go?</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ 
                position: 'relative', 
                border: '2px solid var(--brand-500)', 
                borderRadius: '16px', 
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 0 0 4px var(--brand-50)'
              }}>
                <div style={{ padding: '0 16px', color: 'var(--brand-500)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input 
                  autoFocus
                  ref={inputRef}
                  type="text"
                  placeholder="Search city, hotel name or location"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.length < 2) setResults({ hotels: [], cities: [] });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      handleCitySelect(query.trim());
                      setIsModalOpen(false);
                    }
                  }}
                  style={{ 
                    flex: 1,
                    padding: '14px 0', 
                    border: 'none', 
                    background: 'transparent', 
                    boxShadow: 'none', 
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginTop: 28, fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                {query.length < 2 ? 'POPULAR DESTINATIONS' : 'SEARCH RESULTS'}
              </div>
        
              {/* Autocomplete Results */}
              <div style={{ marginTop: '12px' }}>
                {(query.length < 2 ? ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Hyderabad'] : results.cities).map(c => (
                  <div 
                    key={\`city-\${c}\`}
                    onClick={() => { handleCitySelect(c); setIsModalOpen(false); }}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                      borderRadius: '16px', transition: 'background 0.2s',
                      marginBottom: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ background: '#f1f5f9', width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{c}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>City in India</span>
                    </div>
                  </div>
                ))}

                {results.hotels.map(h => (
                  <div 
                    key={\`hotel-\${h._id}\`}
                    onClick={() => { handleHotelSelect(h._id); setIsModalOpen(false); }}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                      borderRadius: '16px', transition: 'background 0.2s',
                      marginBottom: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ background: '#f1f5f9', width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path><path d="M9 7h.01"></path><path d="M9 11h.01"></path><path d="M15 7h.01"></path><path d="M15 11h.01"></path></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: 2 }}>{h.name}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{h.city}, India</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
`;
    }
}

fs.writeFileSync(path, code);
