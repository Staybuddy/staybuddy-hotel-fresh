import re

with open('app/hotels/[id]/page.tsx', 'r') as f:
    lines = f.readlines()

# The bad state:
# line 402 is `        </div>` (end of Top Title Bar)
# line 406 is `            )}` (dangling)
# line 408 is `            {/* Location / Map */}`
# ...
# line 1038 is `          {/* Right: Booking Panel */}`
# line 1416 is `      </div>` (end of bookingStep === 0 block)

# Let's find the exact indices
top_title_end = 0
for i, line in enumerate(lines):
    if "Add to Wishlist" in line:
        # The next </div></div> is at i+2 and i+3
        top_title_end = i + 3
        break

location_map_start = 0
for i, line in enumerate(lines):
    if "{/* Location / Map */}" in line:
        location_map_start = i
        break

right_panel_start = 0
for i, line in enumerate(lines):
    if "{/* Right: Booking Panel */}" in line:
        right_panel_start = i
        break

booking_step_1_start = 0
for i, line in enumerate(lines):
    if "{bookingStep === 1 && selectedRoom && (" in line:
        booking_step_1_start = i
        break

print(f"top_title_end: {top_title_end}")
print(f"location_map_start: {location_map_start}")
print(f"right_panel_start: {right_panel_start}")
print(f"booking_step_1_start: {booking_step_1_start}")
