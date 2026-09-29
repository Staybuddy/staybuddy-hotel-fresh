import re

with open('app/hotels/[id]/page.tsx', 'r') as f:
    lines = f.readlines()

# Extract the parts
before_grid = lines[:402]
left_column_items = lines[407:1037]
right_column_items = lines[1037:1416]
after_grid = lines[1417:]

hero_and_details = """
        {/* Main Grid Wrapper */}
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: "var(--space-8)",
            alignItems: "flex-start",
            paddingBottom: "var(--space-16)",
          }}
        >
          {/* Left Column */}
          <div>
            {/* Hero Images Gallery */}
            <div style={{ marginBottom: "var(--space-6)" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "16px",
                  borderRadius: "24px",
                  overflow: "hidden",
                  height: 400,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveImg(0)}
                >
                  {hotel.images?.[0] ? (
                    <Image
                      src={hotel.images[0]}
                      alt={hotel.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 66vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ background: "#e2e8f0", width: "100%", height: "100%" }} />
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  {[1, 2].map((idx) => (
                    <div
                      key={idx}
                      style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}
                      onClick={() => setActiveImg(idx)}
                    >
                      {hotel.images?.[idx] ? (
                        <Image
                          src={hotel.images[idx]}
                          alt={`${hotel.name} ${idx + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ background: "#e2e8f0", width: "100%", height: "100%" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header">
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>About Property</h3>
              </div>
              <div className="card-body">
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                  {hotel.description || "Experience a wonderful stay at our property, offering premium amenities and excellent service. Perfectly located for both business and leisure travelers."}
                </p>
              </div>
            </div>

            {/* Amenities */}
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header">
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Amenities</h3>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {hotel.amenities?.map((amenity: string, idx: number) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "1.2rem" }}>{AMENITY_ICONS[amenity] || "✨"}</span>
                      <span style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 500 }}>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* House Rules */}
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header">
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>House Rules</h3>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>Check-in</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>From 12:00 PM</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>Check-out</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Until 11:00 AM</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>Cancellation</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Free before 24 hours</span>
                </div>
              </div>
            </div>
"""

# Reconstruct
new_file_content = ""
new_file_content += "".join(before_grid)
new_file_content += hero_and_details
new_file_content += "".join(left_column_items)
new_file_content += "          </div>\n\n" # Close Left Column
new_file_content += "".join(right_column_items)
new_file_content += "        </div>\n" # Close Main Grid Wrapper
new_file_content += "      </div>\n\n" # Close bookingStep === 0 Wrapper
new_file_content += "".join(after_grid)

with open('app/hotels/[id]/page.tsx', 'w') as f:
    f.write(new_file_content)

print("Rewritten successfully.")
