# BlockFund - Blockchain Crowdfunding Platform

A decentralized crowdfunding platform built on blockchain technology that allows users to fund innovative projects using real cryptocurrency (MetaMask) or unlimited demo transactions for testing. The platform features real-time deadline countdowns, transparent funding progress tracking, and secure creator withdrawals.

## Features

- **Dual Transaction Modes**: Fund projects with real ETH via MetaMask or use demo mode for unlimited testing
- **User Authentication**: Secure login via Replit Auth (OpenID Connect)
- **Project Creation**: Create crowdfunding projects with detailed descriptions and precise deadlines (date + time)
- **Real-time Countdown**: See exactly how much time is left with live countdown timers
- **Funding Progress**: Visual progress bars showing how close each project is to its goal
- **Creator Dashboard**: View your projects, pending refunds, and transaction history
- **Withdrawal System**: Automatically claim funds when projects reach their goal
- **Refund Management**: Request and process refunds if projects don't meet their goals by deadline
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes for comfortable viewing

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and optimized builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS for utility-first styling
- ethers.js for blockchain interactions

**Backend:**
- Node.js + Express.js server
- Drizzle ORM with type-safe database operations
- PostgreSQL (Neon serverless) for data persistence
- Passport.js for authentication
- Session-based authentication with PostgreSQL storage

**Blockchain:**
- MetaMask wallet integration
- Ethereum blockchain network
- Real transaction support with hash tracking

## Prerequisites

Before running the application, ensure you have:

1. A Replit account
2. A web browser with MetaMask extension (for real transactions)
3. An Ethereum wallet funded with test ETH (for real transaction testing)

## Step-by-Step Setup & Running Instructions

### Step 1: Open the Project

The project is already set up in Replit. Simply open your Replit project containing this code.

### Step 2: Install Dependencies

The dependencies should already be installed, but if needed, run:

```bash
npm install
```

This installs all required packages including React, Express, Drizzle ORM, and blockchain libraries.

### Step 3: Set Up Environment Variables

The database connection is automatically set up via Replit's PostgreSQL integration. The following environment variables should already be configured:

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Database credentials

These are managed by Replit and don't require manual configuration.

### Step 4: Initialize the Database (First Time Only)

If this is the first time running the application, set up the database schema:

```bash
npm run db:push
```

This creates all necessary tables (users, projects, transactions, refunds, sessions) in PostgreSQL.

### Step 5: Start the Application

Run the development server with:

```bash
npm run dev
```

You should see output similar to:
```
> rest-express@1.0.0 dev
> NODE_ENV=development tsx server/index-dev.ts
9:01:13 AM [express] serving on port 5000
```

The application is now running!

### Step 6: Access the Application

1. Click the **"Open in new tab"** button in Replit's browser preview (top right)
2. You'll see the BlockFund landing page
3. Click **"Get Started"** to begin

### Step 7: Complete Authentication

1. You'll be redirected to Replit Auth login
2. Sign in with your Replit account
3. You'll be redirected back to the application as an authenticated user

### Step 8: Create Your First Project

1. Click **"+ Create Project"** in the header
2. Fill in the project details:
   - **Title**: Project name
   - **Description**: What is your project about?
   - **Funding Goal**: Target amount in ETH (e.g., 5)
   - **Deadline Date**: When should funding end?
   - **Deadline Time**: What time should funding end?
   - **Project Image URL**: Link to a project image (optional)
3. Click **"Create Project"** to publish

### Step 9: Fund a Project

**Demo Mode (Recommended for Testing):**
1. Find any project on the home page
2. Click on the project card
3. Scroll to the funding section
4. Enter an amount (e.g., 0.5 ETH)
5. Click the **"Fund with Demo"** button (outlined)
6. Confirm the transaction
7. Watch the funding progress bar update instantly!

**Real Mode (MetaMask):**
1. Ensure MetaMask is installed and you have test ETH
2. Connect your wallet (MetaMask will prompt you)
3. Click on a project and enter an amount
4. Click the **"Fund with MetaMask"** button (solid blue)
5. Confirm the transaction in MetaMask
6. Wait for blockchain confirmation (takes 10-30 seconds)
7. Your transaction appears in the transaction history

### Step 10: Monitor Project Progress

1. Go to **"My Projects"** in the sidebar
2. See all your created projects with:
   - Current funding amount
   - Number of backers
   - Time remaining (live countdown)
   - Funding percentage
3. Click any project to view transaction history and manage refunds

### Step 11: Withdraw Funds (For Creators)

Once a project reaches its funding goal:
1. Go to **"My Projects"**
2. Click the project that met its goal
3. Click the **"Withdraw Funds"** button
4. Funds are transferred to the creator's wallet

### Step 12: Request Refunds (For Backers)

If a project deadline passes without meeting its goal:
1. Go to **"My Projects"**
2. Click the project
3. Scroll to the refund section
4. Click **"Request Refund"**
5. The project creator can then approve your refund

## Application Structure

```
project/
├── client/src/                    # Frontend React application
│   ├── pages/                     # Page components
│   │   ├── Landing.tsx           # Welcome/intro page
│   │   ├── Home.tsx              # Browse projects
│   │   ├── CreateProject.tsx      # Create new project
│   │   ├── ProjectDetail.tsx      # View project & fund
│   │   └── MyProjects.tsx         # User's projects & refunds
│   ├── components/               # Reusable UI components
│   │   ├── FundingProgress.tsx   # Progress bar visualization
│   │   ├── CountdownTimer.tsx    # Deadline countdown
│   │   └── TransactionTypeBadge.tsx # Real/Demo badge
│   ├── lib/                       # Utility functions
│   │   ├── queryClient.ts         # TanStack Query setup
│   │   ├── web3Utils.ts          # Blockchain utilities
│   │   └── dateUtils.ts          # Date formatting
│   └── App.tsx                    # Main routing component
│
├── server/                        # Backend Node.js/Express
│   ├── index-dev.ts              # Development server entry
│   ├── index-prod.ts             # Production server entry
│   ├── routes.ts                 # API endpoints
│   ├── storage.ts                # Database operations
│   └── replitAuth.ts             # Replit Auth integration
│
├── shared/                        # Shared code (client & server)
│   └── schema.ts                 # Database schema & types
│
├── package.json                   # Dependencies
├── vite.config.ts                # Vite build configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                      # This file
```

## Available NPM Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Run production server
npm run check    # Type check TypeScript
npm run db:push  # Sync database schema (Drizzle ORM)
```

## Troubleshooting

### Database Connection Issues
- Ensure the DATABASE_URL environment variable is set
- Run `npm run db:push` to sync the schema
- Check Replit's Database tab for connection details

### MetaMask Not Connecting
- Ensure MetaMask extension is installed in your browser
- Switch MetaMask to Ethereum Sepolia or a test network
- Refresh the page and try connecting again

### Project Not Appearing After Creation
- Clear browser cache (Cmd/Ctrl + Shift + R)
- Check the browser console for errors
- Refresh the page

### Transactions Not Showing
- Wait a few seconds for the page to refresh
- Try clicking "My Projects" to reload transaction history
- Check MetaMask to confirm the transaction succeeded

## API Endpoints

All endpoints are protected by authentication middleware.

**Authentication:**
- `GET /api/auth/user` - Get current user info
- `GET /api/login` - Initiate Replit Auth login
- `GET /api/callback` - OAuth callback (handled automatically)
- `GET /api/logout` - Logout current user

**Projects:**
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `GET /api/my-projects` - Get user's created projects

**Transactions:**
- `GET /api/projects/:id/transactions` - Get project transactions
- `POST /api/projects/:id/fund` - Create transaction (demo or real)

**Withdrawals:**
- `POST /api/projects/:id/withdraw` - Withdraw funds to creator

**Refunds:**
- `GET /api/refund-requests` - Get refund requests
- `POST /api/refund-requests` - Request a refund
- `POST /api/refund-requests/:id/process` - Approve/deny refund

## Key Design Decisions

1. **Dual Transaction Mode**: Demo transactions for unlimited testing, real transactions for production use
2. **Real-time Deadlines**: Client-side countdown timers for responsive UX
3. **PostgreSQL Database**: Reliable data persistence with ACID guarantees
4. **Session-based Auth**: Secure HTTP-only cookies via Replit Auth
5. **Type Safety**: Full TypeScript coverage with Zod validation
6. **Responsive Design**: Mobile-first approach with Tailwind CSS
7. **Blockchain Integration**: Client-side only via ethers.js for decentralization

## Contributing

This is a learning project demonstrating blockchain integration with web applications. Feel free to explore, modify, and build upon it!

## License

MIT License - Feel free to use this project for learning and development.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console logs (F12)
3. Check the Replit logs in the bottom terminal
4. Ensure all environment variables are properly configured

---

**Happy crowdfunding! 🚀**
