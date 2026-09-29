import React from 'react';
const x = () => {
return (
	            >
	              <div
	                style={{
	                  display: "flex",
	                  alignItems: "center",
	                  gap: 12,
	                  marginBottom: 4,
	                }}
	              >
	                <svg
	                  width="20"
	                  height="20"
	                  viewBox="0 0 24 24"
	                  fill="none"
	                  stroke="var(--brand-600)"
	                  strokeWidth="2"
	                  strokeLinecap="round"
	                  strokeLinejoin="round"
	                >
	                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
	                  <circle cx="12" cy="10" r="3" />
	                </svg>
	                <span
	                  style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}
	                >
	                  {hotel.city}
	                </span>
	              </div>
	              <div
	                style={{
	                  fontSize: "1.05rem",
	                  color: "var(--text-secondary)",
	                  marginLeft: 32,
	                  marginBottom: 16,
	                }}
	              >
	                {hotel.address}
	              </div>
	              <a
	                href={`https://maps.google.com/?q=${encodeURIComponent(`${hotel.name}, ${hotel.address}, ${hotel.city}`)}`}
	                target="_blank"
	                rel="noreferrer"
	                className="btn btn-primary"
	                style={{
	                  width: "100%",
	                  display: "flex",
	                  justifyContent: "center",
	                  alignItems: "center",
	                  gap: 8,
	                  fontSize: "1rem",
	                  padding: "14px",
	                  borderRadius: "var(--radius-md)",
	                  textDecoration: "none",
	                }}
	              >
	                <svg
	                  width="18"
	                  height="18"
	                  viewBox="0 0 24 24"
	                  fill="none"
	                  stroke="currentColor"
	                  strokeWidth="2"
	                  strokeLinecap="round"
	                  strokeLinejoin="round"
	                >
	                  <line x1="22" y1="2" x2="11" y2="13" />
	                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
	                </svg>
	                Get Directions
	              </a>
	            </div>
	
	            {bookingStep === 0 &&
	              (() => {
	                if (!selectedRoom) {
	                  return (
	                    <div
	                      className="card"
	                      style={{
	                        padding: "32px 24px",
	                        textAlign: "center",
	                        display: "flex",
	                        flexDirection: "column",
	                        alignItems: "center",
	                        justifyContent: "center",
	                        gap: 16,
	                      }}
	                    >
	                      <div style={{ fontSize: "3rem" }}>🛏️</div>
	                      <h3
	                        style={{
	                          fontSize: "1.25rem",
	                          fontWeight: 800,
	                          margin: 0,
	                        }}
	                      >
	                        Select a Room
	                      </h3>
	                      <p
	                        style={{
	                          fontSize: "0.9rem",
	                          color: "var(--text-secondary)",
	                          margin: 0,
	                        }}
	                      >
	                        Please choose a room category from the available options
	                        to view pricing and continue with your booking.
	                      </p>
	                    </div>
	                  );
	                }
	
	                const displayRoom = selectedRoom;
	
	                const currentPrice =
	                  occupancy === "single"
	                    ? displayRoom.priceSingle
	                    : occupancy === "triple"
	                      ? displayRoom.priceTriple
	                      : displayRoom.priceDouble || displayRoom.priceSingle;
	
	                return (
	                  <div className="card" style={{ padding: "var(--space-5)" }}>
	                    <div
	                      style={{
	                        color: "var(--success)",
	                        fontWeight: 600,
	                        fontSize: "0.85rem",
	                        marginBottom: 16,
	                        display: "flex",
	                        alignItems: "center",
	                        gap: 6,
	                        background: "#dcfce7",
	                        padding: "6px 10px",
	                        borderRadius: "var(--radius-sm)",
	                      }}
	                    >
	                      <span
	                        style={{
	                          width: 8,
	                          height: 8,
	                          borderRadius: "50%",
	                          background: "var(--success)",
	                          display: "inline-block",
	                        }}
	                      />
	                      12 Rooms Available • Live Instant API Confirmation
	                    </div>
	
	                    <div
	                      style={{
	                        fontSize: "0.85rem",
	                        color: "var(--text-secondary)",
	                        fontWeight: 600,
	                        marginBottom: 8,
	                        textTransform: "uppercase",
	                        letterSpacing: "0.05em",
	                      }}
	                    >
	                      <svg
	                        width="14"
	                        height="14"
	                        viewBox="0 0 24 24"
	                        fill="none"
	                        stroke="currentColor"
	                        strokeWidth="2"
	                        style={{ marginRight: 6, verticalAlign: "middle" }}
	                      >
	                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
	                        <circle cx="9" cy="7" r="4" />
	                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
	                        <path d="M16 3.13a4 4 0 010 7.75" />
	                      </svg>
	                      Select Room Occupancy:
	                    </div>
	
	                    <div
	                      style={{
	                        display: "grid",
	                        gridTemplateColumns: "1fr 1fr 1fr",
	                        gap: 8,
	                        marginBottom: 20,
	                      }}
	                    >
	                      {["single", "double", "triple"].map((occ) => {
	                        const p =
	                          occ === "single"
	                            ? displayRoom.priceSingle
	                            : occ === "triple"
	                              ? displayRoom.priceTriple
	                              : displayRoom.priceDouble ||
	                                displayRoom.priceSingle;
	                        if (!p) return null;
	                        return (
	                          <div
	                            key={occ}
	                            onClick={() => setOccupancy(occ as any)}
	                            style={{
	                              border:
	                                occupancy === occ
	                                  ? "2px solid #2563eb"
	                                  : "1px solid var(--border)",
	                              borderRadius: "var(--radius-md)",
	                              padding: "8px 4px",
	                              textAlign: "center",
	                              cursor: "pointer",
	                              background:
	                                occupancy === occ ? "#eff6ff" : "white",
	                              transition: "all 0.2s",
	                            }}
	                          >
	                            <div
	                              style={{
	                                fontSize: "0.75rem",
	                                fontWeight: 600,
	                                color:
	                                  occupancy === occ
	                                    ? "#1d4ed8"
	                                    : "var(--text-primary)",
	                                textTransform: "capitalize",
	                              }}
	                            >
	                              {occ} Room {occ === "double" && "⭐"}
	                            </div>
	                            <div
	                              style={{
	                                fontSize: "0.85rem",
	                                fontWeight: 700,
	                                marginTop: 4,
	                              }}
	                            >
	                              ₹{p.toLocaleString()}
	                            </div>
	                          </div>
	                        );
	                      })}
	                    </div>
	
	                    <div
	                      style={{
	                        display: "flex",
	                        alignItems: "flex-end",
	                        gap: 8,
	                        marginBottom: 12,
	                      }}
	                    >
	                      <div
	                        style={{
	                          fontSize: "2.5rem",
	                          fontWeight: 900,
	                          lineHeight: 1,
	                        }}
	                      >
	                        ₹{currentPrice.toLocaleString()}
	                      </div>
	                      <div
	                        style={{
	                          color: "var(--text-secondary)",
	                          fontSize: "0.9rem",
	                          paddingBottom: 4,
	                        }}
	                      >
	                        Per Night ({occupancy.toUpperCase()} OCCUPANCY)
	                      </div>
	                    </div>
	
	                    <p
	                      style={{
	                        fontSize: "0.85rem",
	                        color: "var(--text-secondary)",
	                        marginBottom: 20,
	                      }}
	                    >
	                      + Verified Live B2B Guaranteed Rate (18% Margin Applied)
	                    </p>
	
	                    <div
	                      style={{
	                        background: "#dcfce7",
	                        color: "#166534",
	                        padding: "10px 14px",
	                        borderRadius: "var(--radius-sm)",
	                        fontSize: "0.9rem",
	                        fontWeight: 600,
	                        marginBottom: 20,
	                        display: "flex",
	                        alignItems: "center",
	                        gap: 8,
	                      }}
	                    >
	                      <svg
	                        width="18"
	                        height="18"
	                        viewBox="0 0 24 24"
	                        fill="none"
	                        stroke="currentColor"
	                        strokeWidth="2"
	                      >
	                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
	                        <polyline points="22 4 12 14.01 9 11.01" />
	                      </svg>
	                      Free Cancellation till 24 hrs before check in
	                    </div>
	
	                    <button
	                      className="btn"
	                      style={{
	                        width: "100%",
	                        fontSize: "1.1rem",
	                        padding: "14px",
	                        background: "#f97316",
	                        color: "white",
	                        border: "none",
	                        marginBottom: 20,
	                        textTransform: "uppercase",
	                        fontWeight: 800,
	                        cursor: "pointer",
	                        borderRadius: "var(--radius-md)",
	                        boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
	                      }}
	                      onClick={() => {
	                        openReview(displayRoom);
	                      }}
	                    >
	                      🚀 Book This Now
	                    </button>
	
	                    <div
	                      style={{
	                        border: "1px dashed #f59e0b",
	                        borderRadius: "var(--radius-md)",
	                        padding: "16px",
	                        display: "flex",
	                        gap: 16,
	                        alignItems: "center",
	                        background: "#fffbeb",
	                      }}
	                    >
	                      <div
	                        style={{
	                          background: "#f59e0b",
	                          color: "white",
	                          fontWeight: 700,
	                          fontSize: "0.85rem",
	                          padding: "6px 12px",
	                          borderRadius: "var(--radius-sm)",
	                          whiteSpace: "nowrap",
	                        }}
	                      >
	                        Live Confirmed Inventory
	                      </div>
	                      <div
	                        style={{
	                          fontSize: "0.85rem",
	                          color: "#92400e",
	                          fontWeight: 600,
	                        }}
	                      >
	                        Your room is reserved instantly through our direct B2B
	                        inventory channel.
	                      </div>
	                    </div>
	                  </div>
	                );
)
};
