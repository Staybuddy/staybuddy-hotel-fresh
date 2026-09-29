import re

with open('app/hotels/[id]/page.tsx', 'r') as f:
    content = f.read()

# We want to operate on the file as string sections, but some chunks are very specific.

# 1. Remove Top Bar (Stars, Location, Wishlist)
# It starts with {/* Top Bar (Stars, Location, Wishlist) */} and ends before {/* Hero Images Gallery */}
top_bar_pattern = re.compile(r'\{\/\* Top Bar \(Stars, Location, Wishlist\) \*\/}.*?(?=\{\/\* Hero Images Gallery \*\/})', re.DOTALL)
content = top_bar_pattern.sub('', content)

# 2. Remove Main Content Title Area
# It starts with {/* Main Content Title Area */} and ends before {/* Review Box */}
title_area_pattern = re.compile(r'\{\/\* Main Content Title Area \*\/}.*?(?=\{\/\* Review Box \*\/})', re.DOTALL)
content = title_area_pattern.sub('', content)

# 3. Extract Hero Images Gallery
# It starts with {/* Hero Images Gallery */} and ends before {/* Review Box */} (which was originally after Title Area)
# Wait, now that Title Area is removed, Hero Images Gallery goes up to the end of its div.
hero_pattern = re.compile(r'(\{\/\* Hero Images Gallery \*\/}.*?</div>\s*</div>\s*</div>)', re.DOTALL)
hero_match = hero_pattern.search(content)
if hero_match:
    hero_code = hero_match.group(1)
    content = content.replace(hero_code, '')
    
    # Strip the `<div className="container">` wrapper from the Hero Image Gallery since it will be inside another container
    # The first `<div className="container" ...>` needs to go, and its closing `</div>` needs to go.
    # Actually, let's just change it to `<div style={{ marginBottom: "var(--space-6)" }}>`
    hero_code = hero_code.replace('className="container" ', '')

# 4. Construct the New Title Bar
new_title_bar = """
        {/* NEW Top Title Bar */}
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "var(--space-4)",
            paddingBottom: "var(--space-4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
              {hotel.name}
            </h1>
            <div style={{ color: "#f59e0b", fontSize: "1rem" }}>
              {"⭐".repeat(hotel.starRating || 4)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              style={{
                padding: "8px 16px",
                background: "white",
                border: "1px solid #cbd5e1",
                borderRadius: 24,
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#0f172a",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              Add to Wishlist
            </button>
          </div>
        </div>
"""

# Insert the New Title Bar after the Breadcrumb
breadcrumb_end_pattern = re.compile(r'(\{\/\* Breadcrumb \*\/}.*?</div>\s*</div>)', re.DOTALL)
content = breadcrumb_end_pattern.sub(r'\1' + '\n' + new_title_bar, content)

# 5. Insert Hero Images Gallery into the Left Column
# Find `{/* Left: Hotel Info */}` and insert `hero_code` right after the opening `<div>`
left_col_pattern = re.compile(r'(\{\/\* Left: Hotel Info \*\/}\s*<div>)')
if hero_match:
    content = left_col_pattern.sub(r'\1\n' + hero_code, content)

with open('app/hotels/[id]/page.tsx', 'w') as f:
    f.write(content)

print("Transformation complete")
