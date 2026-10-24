# Dear Day — Design System & Architectural Standards (`design.md`)

*Version: 2.0.0 — Archival Edition*  
*Last Updated: October 2026*  
*Platform: Cross-Platform (Android & iOS) via Expo & React Native*

---

## 1. Design Philosophy & Product Ethos

Dear Day is built on the concept of **Quiet Archival Elegance**. Unlike social feeds designed for dopamine, doomscrolling, and metric vanity, Dear Day is an intimate daily ritual designed to turn four authentic daily moments into a tangible, physical hardbound photobook.

### Core Tenets
1. **Photo-First Archival Pacing:**  
   Every entry is treated not as a social media post, but as a spread in a limited-edition coffee table book. Layout, typography, and paper texture reflect physical printing standards.
2. **Tactile Craftsmanship:**  
   Smyth-sewn cloth binding, embossed foil lettering, deckled cotton paper textures, and realistic 3D page curls replace flat generic digital carousels.
3. **Calm, Uncluttered Interface:**  
   Secondary options (layout switching, custom collection sorting, export, favorites) are discreetly placed inside a "More" (`...`) sheet, keeping the focus entirely on the memory being captured.
4. **Permanent & Respectful:**  
   No unsolicited notifications, no AI slop, no nagging badges. The 7-day habit tracker uses honest dates, checkmarks, and calm encouragement.

---

## 2. Color System & Surface Hierarchy

Dear Day uses an **archival paper & ink palette**. To ensure high visual clarity, each surface type has a distinct semantic token and visual weight.

### Semantic Tokens (`constants/colors.ts`)

| Token | Light Theme | Dark Theme | Purpose / Usage |
|---|---|---|---|
| `background` | `#F7F4EF` | `#1E1C19` | Uncoated archival cotton paper base background |
| `backgroundAlt` | `#EDE9E2` | `#272420` | Secondary paper tint / sheets / modal headers |
| `card` | `#FFFFFF` | `#2C2925` | Foreground card elevation, tactile suggestion chips, photo frames |
| `foreground` | `#1C1916` | `#F0EDE8` | Primary ink text (high legibility, 8.5:1 contrast) |
| `primary` | `#E8593A` | `#E8593A` | Brand Terracotta — wax seal accent, active states, flame icons |
| `primaryForeground`| `#FFFFFF` | `#FFFFFF` | Text rendered on terracotta buttons and pills |
| `accentLight` | `rgba(232,89,58,0.12)` | `rgba(232,89,58,0.15)` | Terracotta tint for active selection rings, active chips |
| `muted` | `#EDE9E2` | `#272420` | Subtle background for empty slots, unselected state pills |
| `mutedForeground` | `#7A746E` | `#A39D97` | Secondary body text, timestamps, subtitles |
| `tertiary` | `#A49E98` | `#6E6862` | Micro metadata, page numbers, inactive icon strokes |
| `border` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.07)` | Hairline dividers between list items |
| `borderStrong` | `rgba(0,0,0,0.14)` | `rgba(255,255,255,0.12)` | Outer bounding borders for cards and modals |
| `marginLine` | `rgba(232,89,58,0.35)` | `rgba(232,89,58,0.40)` | Left vertical margin rule on notebook paper pages |

### Surface Role Differentiation (Resolving "Same Fill" Issues)

To prevent visual monotony where suggestions, callouts, and tags blend into the same wash:
1. **Interactive Suggestion Pills (Search / Explore Themes):**  
   - Solid `colors.card` background (`#FFFFFF` in light, `#2C2925` in dark).  
   - Framed with `colors.borderStrong`, dark `colors.foreground` text.  
   - Distinct tactile pill appearance that feels like an index card tab.
2. **Archival Helper Notes & Callouts:**  
   - Distinct parchment wash `colors.backgroundAlt` (`#EDE9E2` / `#F4EFEA`).  
   - **3.5dp solid terracotta left accent border** (`borderLeftColor: colors.primary`).  
   - Dedicated icon in `colors.primary`.
3. **Category Badges:**  
   - Translucent category hue (`category.color + '22'`) with fine tinted border (`category.color + '44'`).
4. **Streak & Habit Badges:**  
   - Compact terracotta wash (`colors.accentLight`) with fire icon and bold milestone copy.

---

## 3. Typography Matrix & Hierarchies

Dear Day pairs a timeless serif for literary voice with a geometric grotesque sans-serif for UI clarity.

| Role | Font Family | Size / Line Height | Tracking | Usage |
|---|---|---|---|---|
| **Cover Title** | `PlayfairDisplay_700Bold` | 26dp / 34dp | +0.3dp | Hardbound book cover titles |
| **Page Heading** | `PlayfairDisplay_700Bold` | 18–22dp / 26dp | +0.2dp | Full date headers on paper spreads |
| **Memory Text** | `PlayfairDisplay_400Regular` | 14–15dp / 22dp | 0 | Journaling captions under photographs |
| **UI Header** | `Inter_600SemiBold` / `700Bold` | 15–18dp / 22dp | +0.2dp | Card titles, modal headers, navigation bar |
| **UI Body / Inputs**| `Inter_400Regular` | 13–14dp / 20dp | 0 | Text fields, descriptions, guidelines |
| **Meta / Labels** | `Inter_700Bold` | 9–11dp / 13dp | +0.8–1.2dp | Category pills, page numbers, timestamps, archival stamps |

### Book-Wide Typography Options
Users can customize the body font of an entire book volume:
1. **Playfair Serif:** Classic editorial literary style (`PlayfairDisplay_700Bold` / `PlayfairDisplay_400Regular`).
2. **Garamond:** Timeless publishing elegance (`Georgia` / `serif`).
3. **Inter Sans:** Modern minimalist clarity (`Inter_700Bold` / `Inter_400Regular`).
4. **Typewriter:** Archival vintage journalism (`Courier` / `monospace`).

*Rule: Typography selectors must always show live visual specimens ("Aa Bb Gg 123" + sample quote) rather than plain text labels.*

---

## 4. The 5 Archival Photo-First Layout Engines

Each day spread in a book supports 5 distinct layout reflow options:

### 1. Gallery 2×2 (`quad`)
- **Structure:** 4 balanced square photo frames arranged in a 2×2 grid.
- **Caption:** 2 lines formatted under each photo.
- **Badge:** Minimalist pill tag (`01`, `02`, `FOOD`, etc.) in the bottom-right corner of each photo frame.
- **Best For:** Everyday balanced moments, meals, and varied activities.

### 2. Cinematic Filmstrips (`strips`)
- **Structure:** 4 wide horizontal letterbox photo banners stacked vertically.
- **Caption:** Split layout beneath banner — caption on left, category pill on right.
- **Best For:** Landscapes, street photography, travel days, and panoramas.

### 3. Hero Highlight (`hero`)
- **Structure:** 1 dominant wide focal hero photograph occupying top 55% of the page + 3 micro square vignettes beneath.
- **Caption:** Dedicated 2-line quote for the hero; micro-captions for secondary vignettes.
- **Best For:** Landmark celebrations, birthdays, weddings, concerts, and major milestones.

### 4. Editorial Magazine Spread (`magazine`)
- **Structure:** Alternating 2×2 layout — Row 1 has photo on left and text story on right; Row 2 has text on left and photo on right.
- **Caption:** Long-form quote pacing with literary indentation.
- **Best For:** Thoughtful reflection, deep conversations, and creative writing.

### 5. Polaroid Scrapbook (`polaroid`)
- **Structure:** 4 tactile white instant-film cards with organic physical tilt angles (`-2.5°`, `+3°`, `-1.8°`, `+2.2°`) and soft realistic dropshadows.
- **Caption:** Centered ink-written caption inside the bottom white Polaroid chin.
- **Best For:** Casual snapshots, playful days with friends, and vintage scrapbook feel.

*Rule: Never use internal development terms like "Figma Ref" in user-facing UI. Always show visual wireframe diagrams (`VisualLayoutPicker`).*

---

## 5. Hardbound Volume & 3D Page Turn Mechanics

### Cover Design (Page 0)
- **Full-Bleed Volume:** The cover fills the entire book container (`BOOK_CARD_WIDTH`).
- **Spine Construction:** 32–34dp wide left spine strip in a deeper leather hue (`#171412` or `rgba(0,0,0,0.28)`), featuring embossed sewn ribbing and a vertical gold foil stripe.
- **Corner Brass Accents:** Decorative 22dp gold corner brackets on top-right and bottom-right corners.
- **Foil Typography:** Centered gold foil debossed title (`#FBF8F3` with `#D4AF37` highlights), volume label (`VOL. YYYY • MM`), and quote subtitle.
- **Archival Seal:** Circular gold insignia: `ARCHIVAL FIRST EDITION • COTTON PAPER`.
- **Bookmark Ribbon:** Hanging silk ribbon marker (`#E8593A`) extending below the book card edge.

### Realistic 3D Page Turn
- Built with `Animated.FlatList` with `useNativeDriver: true`.
- Interpolates horizontal scroll offset (`scrollX`):
  - **`perspective: 1200`** creates authentic depth.
  - **`rotateY`:** interpolates from `+45deg` (incoming from left) to `0deg` (flat) to `-55deg` (turning towards spine on left).
  - **`scale`:** interpolates from `0.93` to `1.0` to `0.93` to simulate physical page lift.
  - **`gutter shadow`:** an absolute overlay that smoothly deepens to `0.55 opacity` as the page turns, simulating light falling into the binding gutter.

---

## 6. Retention, Habit Tracking & Celebrations

1. **7-Day Habit Tracker Card:**
   - Displayed immediately beneath the Today tab header.
   - Shows Monday–Sunday with dates (`M 19`, `T 20`, etc.).
   - Completed days render solid terracotta circles with white checkmarks.
   - Today renders an active terracotta ring and indicator dot.
   - Displays active streak count with flame icon (`Fire`) and milestone fraction (`X/7 DAYS`).
2. **Confetti Cannon Celebration:**
   - Triggers when the 4th moment is captured for the day.
   - Custom palette: `#E8593A`, `#C47B3A`, `#2D3F2A`, `#D8B4C0`, `#F2E8DC`.
   - Displays a celebration banner with a direct CTA: **"Flip Today's Page in Book →"**.

---

## 7. Android Ergonomics & Soft Keyboard Standards

1. **System Navigation Bar Clearance:**
   - All bottom toolbars, modal footers, and tab bars calculate bottom safe area using:
     ```ts
     const botPad = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 16;
     ```
   - Prevents 3-button or gesture navigation pills on Android from overlapping CTAs.
2. **Soft Keyboard Avoidance:**
   - `app.json` configures:
     ```json
     "android": {
       "softwareKeyboardLayoutMode": "resize"
     }
     ```
   - All modal scroll containers include `automaticallyAdjustKeyboardInsets={true}` and generous bottom padding (`paddingBottom: 280+`) so typing fields remain visible above the keyboard.

---

## 8. UX Rules for Future Features

1. **Primary Screen Focus:** Keep the main action upfront. In logging, the user writes and uploads photos. Auxiliary configurations belong in the `More` (`...`) sheet.
2. **Visual-First Controls:** Never list layout or typography options as text descriptions. Render miniature wireframes or live font specimens.
3. **No Redundant Microcopy:** Do not add repetitive disclaimers (e.g. "This caption is printed under the photo"). High-quality visual hierarchy makes the output self-evident.
4. **Haptic Feedback:** Pair light impacts (`ImpactFeedbackStyle.Light`) with page flips, selection ticks with toggles, and notification success haptics with completed milestones.
