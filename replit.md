# BlockFund - Blockchain Crowdfunding Platform

## Overview

BlockFund is a blockchain-based crowdfunding platform that enables users to fund innovative projects using cryptocurrency (via MetaMask) or demo mode for testing. The platform emphasizes transparency, trust, and ease of use through a modern web interface with real-time funding progress tracking and deadline countdowns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for client-side routing (lightweight alternative to React Router)
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

**UI Component System**
- shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Component library follows a card-based design pattern for consistency
- Custom spacing scale (2, 4, 6, 8, 12, 16) for visual rhythm
- Typography system using Inter (body) and Space Grotesk (headings) from Google Fonts

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management with aggressive caching
- Custom query client configured with infinite stale time and no automatic refetching
- Form state managed via React Hook Form with Zod validation
- Authentication state derived from user query endpoint

**Key Design Patterns**
- Dual transaction mode: Clear visual distinction between real crypto transactions (solid buttons with MetaMask icon) and demo transactions (outlined, dashed border)
- Real-time countdown timers for project deadlines using client-side interval updates
- Progress visualization with both linear and circular variants
- Responsive grid layouts (3 columns desktop, 2 tablet, 1 mobile)

### Backend Architecture

**Server Framework**
- Express.js HTTP server with custom middleware for request logging
- Separate entry points for development (Vite integration) and production (static serving)
- Session-based authentication with PostgreSQL session store

**Development vs Production**
- Development: Vite middleware integration with SSR template injection
- Production: Pre-built static files served from `dist/public`
- Hot module replacement and error overlays in development only

**API Design**
- RESTful endpoints under `/api` prefix
- Authentication middleware (`isAuthenticated`) protecting all routes except auth endpoints
- Error handling with HTTP status codes and JSON error messages
- Request body validation using Zod schemas

**Data Access Layer**
- Storage interface (`IStorage`) abstracts database operations
- `DatabaseStorage` class implements all CRUD operations
- Separation of concerns: routes → storage layer → database

### Database & ORM

**Database**
- PostgreSQL via Neon serverless database
- WebSocket-based connection pooling for serverless environments
- Database URL configured via environment variable

**ORM & Migrations**
- Drizzle ORM with type-safe schema definitions
- Schema-first approach with TypeScript inference for types
- Drizzle Kit for schema migrations (`db:push` command)
- Shared schema definitions between client and server (`@shared/schema`)

**Schema Design**
- Users table: OAuth profile data (email, names, profile image)
- Projects table: Title, description, goal/current amounts (decimal precision for crypto), deadline, image URL, creator reference
- Transactions table: Amount, type (real/demo), transaction hash, backer reference, project reference
- Refund requests table: Project reference, creator reference, approval status
- Sessions table: Express session storage for authentication persistence
- Decimal types use precision 18, scale 8 for cryptocurrency amounts

**Relationships**
- One-to-many: User → Projects (creator)
- One-to-many: Project → Transactions
- One-to-many: User → Transactions (backer)
- Foreign key constraints enforced at database level

### Authentication & Authorization

**Authentication Provider**
- Replit Auth via OpenID Connect (OIDC)
- Passport.js strategy for OAuth flow
- Session-based authentication with secure HTTP-only cookies
- 7-day session TTL with PostgreSQL persistence

**User Flow**
- Unauthenticated users see landing page
- `/api/login` initiates OAuth flow
- Successful auth creates/updates user record and establishes session
- Protected routes check authentication via middleware
- Session refresh handles token expiration
- `/api/logout` destroys session

**Session Management**
- Connect-pg-simple for PostgreSQL session storage
- Sessions automatically cleaned up after expiration
- CSRF protection via session cookies

### External Dependencies

**Blockchain Integration**
- ethers.js v6 for Ethereum blockchain interaction
- MetaMask browser extension detection and wallet connection
- Real transactions: `eth_requestAccounts` for wallet connection, `eth_sendTransaction` for fund transfers
- Transaction hash tracking for on-chain verification
- Client-side only (no backend blockchain interaction)

**UI Libraries**
- Radix UI primitives: Accessible, unstyled components (dialogs, dropdowns, tooltips, etc.)
- Lucide React: Icon library for consistent iconography
- class-variance-authority: Type-safe component variants
- date-fns: Date formatting and manipulation

**Development Tools**
- Replit-specific plugins for development environment integration
- TSX for running TypeScript Node.js files
- esbuild for production server bundling
- PostCSS with Tailwind CSS and Autoprefixer

**Third-Party Services**
- Neon Database: Serverless PostgreSQL hosting
- Replit Auth: OAuth identity provider
- Google Fonts CDN: Web font delivery