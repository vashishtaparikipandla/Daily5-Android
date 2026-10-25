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

## 4. The 3 Archival Photo-First Layout Engines

Each day spread in a book supports 3 curated archival layout reflow options (pruned from legacy 5 to keep the creation flow delightfully focused and uncluttered):

### 1. Gallery 2×2 (`quad`)
- **Structure:** 4 balanced square photo frames arranged in a 2×2 grid.
- **Caption:** 2 lines formatted under each photo.
- **Badge:** Minimalist pill tag (`01`, `02`, `FOOD`, etc.) in the bottom-right corner of each photo frame.
- **Best For:** Everyday balanced moments, meals, and varied activities.

### 2. Cinematic Filmstrips (`strips`)
- **Structure:** 4 wide horizontal letterbox photo banners stacked vertically.
- **Caption:** Split layout beneath banner — caption on left, category pill on right.
- **Best For:** Landscapes, street photography, travel days, and panoramas.

### 3. Polaroid Scrapbook (`polaroid`)
- **Structure:** 4 tactile white instant-film cards with organic physical tilt angles (`-2.5°`, `+3°`, `-1.8°`, `+2.2°`) and soft realistic dropshadows.
- **Caption:** Centered ink-written caption inside the bottom white Polaroid chin.
- **Best For:** Casual snapshots, playful days with friends, and vintage scrapbook feel.

*Rule: Never use internal development terms like "Figma Ref" in user-facing UI. Always show visual wireframe diagrams (`VisualLayoutPicker`). Layout options are accessed exclusively from the top book studio header, never inside content pages.*

---

## 5. Hardbound Volume & 3D Page Turn Mechanics

### Cover Design (Page 0)
- **Full-Bleed Volume:** The cover fills the entire book container (`BOOK_CARD_WIDTH`).
- **Spine Construction:** 32–34dp wide left spine strip in a deeper leather hue (`#171412` or `rgba(0,0,0,0.28)`), featuring embossed sewn ribbing and a vertical gold foil stripe.
- **Corner Brass Accents:** Decorative 22dp gold corner brackets on top-right and bottom-right corners.
- **Foil Typography:** Centered gold foil debossed title (`#FBF8F3` with `#D4AF37` highlights), volume label (`VOL. YYYY • MM`), and quote subtitle.
- **Archival Seal:** Circular gold insignia: `ARCHIVAL FIRST EDITION • COTTON PAPER`.
- **Bookmark Ribbon:** Hanging silk ribbon marker (`#E8593A`) extending below the book card edge.

### Realistic 3D Stacked Page Roll (StPageFlip Architecture)
- Eliminates flat horizontal carousel sliding in favor of single-page viewport stacked turning:
  - **Stationary Underlying Base:** The incoming page sits stationary directly underneath.
  - **Spine-Anchored 3D Transform:** The turning page pivots with left spine anchor:
    `transform: [{ perspective: 1400 }, { translateX: -W/2 }, { rotateY: '-180deg' to '0deg' }, { translateX: W/2 }]`.
  - **Dynamic Paper Shadow Overlays:** Graduated shadows sweep across the turning page and the underlying stationary sheet, replicating realistic paper curl curvature.
  - **Single Page Focus:** Viewport focuses on one page at a time with smooth gesture (`PanResponder`) and button flip transitions.
  - **Full-Width Hardbound Cover:** `BOOK_CARD_WIDTH = Math.min(SCREEN_WIDTH - 24, 440)` for both cover and inside spreads.

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

---

## 9. Onboarding Composition & Coachmark Walkthrough Standards

1. **Predefined Birth Date & Smart Formatting:**
   - Pre-fills a standard default (`2000-01-01`) allowing immediate progression.
   - Smart auto-masking extracts digits and inserts hyphens on the fly (`YYYY-MM-DD`).
   - Quick generational preset chips (`Gen Z 2002`, `Millennial 1995`, `90s Kid 1990`, `Gen X 1980`) enable 1-tap population.
   - Dynamic live stat banner displays age, weeks lived, and weeks remaining in real time.

2. **Life in 4,160 Weeks Tapestry:**
   - Replaces floating micro-boxes with a full-screen, museum-grade archival composition.
   - Framed tapestry with subtle borders and axis markers: Top (`Wk 1 → Wk 52`) and Left milestones (`Age 0, 20, 40, 60, 80`).
   - Sticky CTA with `insets.bottom` clearance ensures effortless, comfortable thumb access above Android navigation bars.

3. **Golden-Ratio Onboarding Carousel:**
   - Top bar contains a circular back button (on slides > 0), a step indicator pill (`X of 4`), and a capsule Skip button.
   - Centered visual stage (height 200dp) with breathing animations.
   - Centered serif headlines and readable body text with unified pill pagination.

4. **Contextual Spotlight Walkthrough (FTUO):**
   - Eliminates generic centered modal carousels.
   - Uses a dimmed backdrop (`rgba(15, 12, 10, 0.76)`) with illuminated spotlight frames highlighting live screen elements:
     - Step 1: Tonight's Moments Prompt
     - Step 2: 7-Day Archival Streak Ribbon
     - Step 3: Books Tab in Bottom Navigation
   - Floating dark cards (`#1C1917`) with pointer triangles/carets pointing directly to targets, step pills (`1 of 3`), Back/Skip actions, and clear primary CTAs.

5. **Authentic Vector Branding:**
   - Third-party auth providers must use official vector assets (4-color Google "G" SVG and official circular Telegram paper airplane badge) rather than monochrome or generic approximations.

---

## 10. Archival Streak Journey, Empty State System & Cloud Persistence

1. **Streak & Archival Calendar Modal (`StreakCalendarModal.tsx`):**
   - Opened by tapping the Streak card on the Today screen.
   - Shows days from user's joining date to today in an interactive month calendar.
   - Completion representation:
     - 4/4 Moments (100%): Solid terracotta circle with white checkmark (`✓`).
     - 1-3 Moments: Circular progress ring with dynamic SVG arc (`25%`, `50%`, `75%`) around the day number.
     - 0 Moments: Quiet empty circle; today highlighted with an active terracotta ring.
   - Tapping any date navigates directly to `log-modal` for viewing or filling moments.
   - KPI Stats Bar: Day Streak, Days Logged, Total Moments, and Month Completion %.

2. **Universal Empty State Standard (`EmptyState.tsx`):**
   - Eliminates layout inconsistencies (no awkward top-slammed or arbitrary padding states).
   - Centered vertical composition (`flex: 1, minHeight: 340, justifyContent: 'center'`).
   - Soft icon container (`width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentLight`).
   - Playfair Display headline (20px) + readable body (14px, max-width 320px).
   - Actionable tactile pill CTA giving immediate user direction.

3. **Persistent Notice & Banner Dismissal:**
   - Informational notices (such as "Explore Sample Volume" and search helper callouts) include an explicit `X` dismiss button.
   - Dismissal state is saved to `AsyncStorage`.
   - Taking the recommended action (e.g., tapping the sample book or executing a search) automatically dismisses the hint permanently.

4. **WhatsApp-Style Cloud Backup Architecture:**
   - Zero-server-cost model: User-owned encrypted Google Drive `appDataFolder` storage (AES-256-GCM).
   - Prominent WhatsApp-style status card on Profile tab:
     - Last Backup timestamp (`Today at 9:42 PM`, `Yesterday`, etc.)
     - Payload size (`1.4 MB`)
     - Google Account (`user@gmail.com`)
     - One-tap "Back Up Now" button.
   - Automatic restore prompt on reinstallation when previous archives are discovered in Google Drive.

---

## 11. Single Primary CTA Per Viewport Standard

To maintain calm, focused, and distraction-free cognitive flow:
1. **Rule of One:** Every viewport MUST have strictly one prominent primary CTA (`backgroundColor: colors.primary`).
2. **Secondary Demotion:** All parallel or secondary actions (such as "Print" and "Share" on individual book cards in the Library, "Cancel", "Clear Search", or carousel "← Back") MUST use secondary or outline styling (`backgroundColor: colors.muted` or `colors.card`, `borderColor: colors.border`, `color: colors.foreground`).
3. **No Visual Competition:** In the Library view, `+ New Book` is the sole primary CTA, preventing multiple conflicting terracotta buttons across each grid card.

---

## 12. Universal Brand Logo & Organic Loader Standards

1. **Official Brand Logo (`BrandLogo.tsx`):**
   - Brand mark: Organic botanical coral/sprout mark in `#E8593A` (aspect ratio 1.473).
   - Horizontal and vertical lockups with serif lettering.
   - Applied to app icons (`icon.png`, `adaptive-icon.png`) on an uncoated `#F7F4EF` archival background.
2. **Argon Gentle Sway Loader (`BrandLogoLoader`):**
   - Replaced all generic OS `ActivityIndicator` spinners with `BrandLogoLoader`.
   - Physics: Anchored at the root bottom center (`transformOrigin: '50% 100%'`).
   - Harmonic motion: Sway rotation (-2.5° to +2.5°), skew (-3° to +3°), and subtle breathing scale (1.0 to 1.04).
3. **Social & Archival Export:**
   - **Multi-page Book PDF:** Complete high-resolution photobook PDF with archival colophon page ("DEAR DAY ARCHIVAL PRESS", acid-free finish).
   - **Single Day Card Sharing:** Offscreen rasterization via `react-native-view-shot` with "Dear Day" branding imprinted at the top, formatted as a 1080p card ready for social sharing.



