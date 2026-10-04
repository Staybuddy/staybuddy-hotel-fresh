import re

with open('components/HomeClient.tsx', 'r') as f:
    content = f.read()

# Find the start and end of the search wrapper
start_idx = content.find('<div className="fade-in hero-search-wrapper" style={{')
end_idx = content.find('</button>\n            </div>', start_idx) + len('</button>\n            </div>')

search_bar_code = content[start_idx:end_idx]

# Replace it with {renderSearchBar()}
content = content[:start_idx] + '{renderSearchBar()}' + content[end_idx:]

# Insert the renderSearchBar function definition just before the return (
return_idx = content.find('return (\n    <div>')
function_code = f"  const renderSearchBar = () => (\n    {search_bar_code}\n  );\n\n  "
content = content[:return_idx] + function_code + content[return_idx:]

# Add showStickySearch state
state_insert_idx = content.find('const [showDatePicker, setShowDatePicker]')
content = content[:state_insert_idx] + 'const [showStickySearch, setShowStickySearch] = useState(false);\n  ' + content[state_insert_idx:]

# Pass it to Navbar
navbar_find = '<Navbar middleContent={'
navbar_replace = '<Navbar \n        extendedContent={showStickySearch ? renderSearchBar() : null}\n        middleContent={'
content = content.replace(navbar_find, navbar_replace)

# Change the onClick in the sticky header
onclick_find = 'onClick={() => {\n                  setSearchData(p => ({ ...p, propertyType: p.propertyType === card.id ? \'\' : card.id }));\n                  window.scrollTo({ top: 0, behavior: \'smooth\' });\n                }}'
onclick_replace = 'onClick={() => {\n                  setSearchData(p => ({ ...p, propertyType: p.propertyType === card.id ? \'\' : card.id }));\n                  setShowStickySearch(p => !p);\n                }}'
content = content.replace(onclick_find, onclick_replace)

with open('components/HomeClient.tsx', 'w') as f:
    f.write(content)

