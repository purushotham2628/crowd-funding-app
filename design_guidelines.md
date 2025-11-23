# Design Guidelines: Blockchain Crowdfunding Platform

## Design Approach
**Reference-Based:** Drawing inspiration from Kickstarter's project showcase patterns combined with modern web3 platforms like OpenSea for blockchain integration aesthetics. Focus on trust, transparency, and clarity given the financial nature of the platform.

## Core Design Principles
1. **Trust Through Transparency:** Clear visual hierarchy for transaction types, funding progress, and deadlines
2. **Blockchain Aesthetic:** Modern, tech-forward design that signals credibility and innovation
3. **Dual-Mode Clarity:** Distinct visual treatment for real vs. demo transactions to prevent confusion

## Typography
- **Primary Font:** Inter (Google Fonts) - clean, modern, excellent for data-heavy interfaces
- **Secondary Font:** Space Grotesk (Google Fonts) - for headings, adds tech-forward character
- **Hierarchy:**
  - H1: Space Grotesk, 48px (36px mobile), Bold
  - H2: Space Grotesk, 36px (28px mobile), Semibold
  - H3: Inter, 24px (20px mobile), Semibold
  - Body: Inter, 16px, Regular
  - Small/Meta: Inter, 14px, Regular
  - Button Text: Inter, 16px, Medium

## Layout System
**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12, and 16 for consistent rhythm
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-16
- Card gaps: gap-6
- Form field spacing: space-y-4

## Component Library

### Navigation
- Fixed header with platform logo, main nav links (Browse, Create, My Projects, Dashboard)
- MetaMask wallet connection button (prominent, top-right)
- User profile dropdown when authenticated

### Project Cards (Browse View)
- Card-based grid layout (3 columns desktop, 2 tablet, 1 mobile)
- Each card includes: project image (16:9), title, creator name, funding progress bar, deadline countdown, funding amount/goal
- Hover state: subtle lift shadow

### Project Detail Page
- **Hero Section:** Full-width project image with gradient overlay
- **Funding Panel (Sticky Sidebar):** 
  - Large funding progress circle or bar
  - Current amount / Goal amount
  - Deadline countdown (days, hours, minutes)
  - **TWO DISTINCT TRANSACTION BUTTONS:**
    - Real Transaction: Solid button with MetaMask icon, labeled "Fund with Crypto"
    - Demo Transaction: Outlined button with demo icon, labeled "Demo Fund (Test Mode)"
  - Amount input field above buttons
- **Main Content:** Project description, creator info, updates timeline
- **Backers/Donors Section:** List with wallet addresses (truncated), amounts, timestamps

### Transaction Type Indicators
- **Real Transactions:** Solid fill, blockchain icon, green accent
- **Demo Transactions:** Dashed border, test tube icon, blue accent
- Always show transaction type badge next to amounts in history

### Dashboard (Creator View)
- Project stats grid (total raised, backers count, time remaining)
- **Action Buttons:**
  - Withdraw: Only enabled when goal met and deadline not expired
  - Refund Management: Only enabled when deadline expired without meeting goal
- Transaction history table with filters (All, Real, Demo)
- Refund requests panel (if applicable)

### Forms
- Clean, generous spacing between fields
- Labels above inputs
- Deadline picker: Date input + separate time inputs (HH:MM)
- Validation states with clear error messages
- Submit buttons: full-width on mobile, auto-width desktop

### Progress Indicators
- Circular progress for funding percentage (project cards)
- Linear progress bar for detailed view
- Countdown timers: card format with days/hours/minutes segments
- Real-time updates when transactions occur

### Transaction Details Modal
- Large amount display at top
- Transaction type badge (Real/Demo)
- Details grid: From (wallet), To (project), Timestamp, Transaction Hash (if real)
- Status indicator (Confirmed/Pending)

## Icons
Use **Heroicons** (via CDN) for consistency:
- Wallet icon for MetaMask connection
- Clock for deadlines
- Chart for progress
- Users for backers
- Arrow paths for transactions
- Beaker/flask for demo mode

## Images
**Hero Image:** Yes - project detail pages should have a prominent hero image (16:9 aspect ratio) showcasing the project. Use gradient overlay for text readability.

**Image Placements:**
- Project cards: Featured image thumbnail
- Project detail hero: Full-width hero image with dark gradient overlay
- Creator profile images: Small circular avatars
- Empty states: Illustration placeholders for "No projects" or "No transactions"

## Animations
**Minimal Use:**
- Funding progress bar fill on page load (1s ease)
- Countdown timer digit transitions
- Success confirmation after transactions (checkmark animation)
- NO scroll animations or excessive motion

## Accessibility
- Clear focus states on all interactive elements
- Sufficient contrast ratios (WCAG AA minimum)
- Semantic HTML throughout
- ARIA labels for wallet addresses (truncated text)
- Keyboard navigation support for all actions
- Screen reader announcements for funding updates

## Responsive Breakpoints
- Mobile: < 768px (single column, stacked layout)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (3-column grids, sidebar layouts)