const fs = require('fs');
const path = './components/HomeClient.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import { createPortal }")) {
    code = code.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { createPortal } from 'react-dom';");
}

if (!code.includes("const [mounted, setMounted] = useState(false);")) {
    code = code.replace(
        "const [showGuestPicker, setShowGuestPicker] = useState(false);",
        "const [showGuestPicker, setShowGuestPicker] = useState(false);\n  const [mounted, setMounted] = useState(false);\n  useEffect(() => setMounted(true), []);"
    );
}

// Fix DatePicker Portal
const datePickerStart = `{showDatePicker && (`;
const datePickerEnd = `</>\n              )}`;
const newDatePicker = `{mounted && showDatePicker && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowDatePicker(false)} />
                  <div className="responsive-popup" style={{ position: 'relative', background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                     <DateRangePicker 
                       checkIn={searchData.checkIn} 
                       checkOut={searchData.checkOut}
                       onChange={(inDate, outDate) => setSearchData(p => ({ ...p, checkIn: inDate, checkOut: outDate }))}
                       onClose={() => setShowDatePicker(false)}
                       activeSelection={activeDateSelection}
                       setActiveSelection={setActiveDateSelection}
                     />
                  </div>
                </div>,
                document.body
              )}`;

const guestPickerStart = `{showGuestPicker && (`;
const guestPickerEnd = `</>\n                )}`;
const newGuestPicker = `{mounted && showGuestPicker && createPortal(
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={(e) => { e.stopPropagation(); setShowGuestPicker(false); }} />
                    <div className="responsive-popup" onClick={e => e.stopPropagation()} style={{ position: 'relative', background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: 'var(--space-5)', width: 320, maxWidth: '100%', cursor: 'default' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rooms</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, rooms: Math.max(1, p.rooms - 1) }))}>−</button>
                            <span style={{ fontWeight: 700, width: 20, textAlign: 'center' }}>{searchData.rooms}</span>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, rooms: Math.min(10, p.rooms + 1) }))}>+</button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Adults</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}>−</button>
                            <span style={{ fontWeight: 700, width: 20, textAlign: 'center' }}>{searchData.adults}</span>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, adults: Math.min(30, p.adults + 1) }))}>+</button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Children</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0 - 17 Years Old</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, children: Math.max(0, p.children - 1) }))}>−</button>
                            <span style={{ fontWeight: 700, width: 20, textAlign: 'center' }}>{searchData.children}</span>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, children: Math.min(10, p.children + 1) }))}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}`;

// Do the replacement
let dStartIndex = code.indexOf(datePickerStart);
let dEndIndex = code.indexOf(datePickerEnd, dStartIndex);
if (dStartIndex !== -1 && dEndIndex !== -1) {
    code = code.substring(0, dStartIndex) + newDatePicker + code.substring(dEndIndex + datePickerEnd.length);
}

let gStartIndex = code.indexOf(guestPickerStart);
let gEndIndex = code.indexOf(guestPickerEnd, gStartIndex);
if (gStartIndex !== -1 && gEndIndex !== -1) {
    code = code.substring(0, gStartIndex) + newGuestPicker + code.substring(gEndIndex + guestPickerEnd.length);
}

fs.writeFileSync(path, code);
