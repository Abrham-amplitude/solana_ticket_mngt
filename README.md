# Ticket Management System with Solana Blockchain

This project consists of two main components:

1. A Node.js API server for ticket management
2. A Solana smart contract for handling ticket operations on the blockchain

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Rust and Cargo (latest stable version)
- Solana CLI tools
- Anchor Framework

## Project Structure

```
├── api/                    # Node.js API server
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── model/             # Database models
│   ├── test/              # Test files
│   └── .env              # Environment variables
└── solanacontract/        # Solana smart contract
    ├── programs/          # Contract source code
    ├── tests/            # Contract tests
    └── Anchor.toml       # Anchor configuration
```

## Setup Instructions

### 1. Solana Contract Setup

1. Install Solana CLI tools:

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.16.27/install)"
```

2. Install Anchor Framework:

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

3. Configure Solana for devnet:

```bash
solana config set --url devnet
solana-keygen new
```

4. Build and deploy the contract:

```bash
cd solanacontract
anchor build
anchor deploy
```

5. Copy the deployed program ID and update it in:
   - `Anchor.toml`
   - `programs/ticket_resell/src/lib.rs`
   - `api/.env`

### 2. API Server Setup

1. Install dependencies:

```bash
cd api
npm install
```

2. Create `.env` file in the `api` directory:

```env
# API Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
DATABASE_URL=mongodb://localhost:27017/mintix
SECRET=your_jwt_secret

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
PROGRAM_ID=your_deployed_program_id

# Wallet Configuration (FOR DEVELOPMENT ONLY)
SECRET_KEY=your_wallet_secret_key
```

3. Start MongoDB:

```bash
mongod
```

4. Start the API server:

```bash
npm start
```

## Testing

### Running API Tests

```bash
cd api
npm test
```

### Running Contract Tests

```bash
cd solanacontract
anchor test
```

## API Endpoints

### Authentication

- POST `/auth/signup` - Create new user
- POST `/auth/login` - Login user
- POST `/auth/logout` - Logout user

### Events

- GET `/v1/events` - List all events
- GET `/v1/event/:id` - Get event details
- POST `/v1/event` - Create new event
- PUT `/v1/event/:id` - Update event
- DELETE `/v1/event/:id` - Delete event

### Tickets

- POST `/v1/tickets/mint` - Mint new ticket
- GET `/v1/tickets/:address` - Get ticket details
- POST `/v1/tickets/:address/list` - List ticket for resale
- POST `/v1/tickets/:address/transfer` - Transfer ticket to new owner

## Smart Contract Functions

### Ticket Operations

- `mint_ticket` - Create new ticket
- `list_ticket_for_resell` - List ticket for resale
- `transfer_ticket` - Transfer ticket to new owner
- `get_ticket` - Get ticket details

## Development Workflow

1. Make changes to the Solana contract:

   - Edit code in `solanacontract/programs/ticket_resell/src/lib.rs`
   - Build and deploy: `anchor build && anchor deploy`
   - Update program ID in configuration files

2. Make changes to the API:

   - Edit routes in `api/routes/`
   - Edit business logic in `api/services/`
   - Update tests in `api/test/`
   - Run tests: `npm test`

3. Testing the full system:
   - Run the full test suite: `cd api && npm test`
   - Test specific endpoints using Postman or curl

### Solana Commands

1. Account Management:

```bash
# Generate new keypair
solana-keygen new

# Check account balance
solana balance

# Request airdrop (devnet)
solana airdrop 2  # Request 2 SOL

# Get account info
solana account <ACCOUNT_ADDRESS>

# Get program logs
solana logs <PROGRAM_ID>
```

2. Network Management:

```bash
# Switch between networks
solana config set --url localhost    # Local
solana config set --url devnet      # Devnet
solana config set --url mainnet     # Mainnet

# Check current configuration
solana config get

# Check cluster status
solana cluster-version
```

3. Program Management:

```bash
# Build program
anchor build

# Deploy program
anchor deploy

# Upgrade program
anchor upgrade

# Get program account info
solana program show <PROGRAM_ID>
```

### API Testing Commands

1. Authentication Tests:

```bash
# Run auth tests only
npm test test/auth.test.js

# Test user signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass","email":"test@example.com"}'

# Test user login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

2. Event Tests:

```bash
# Run event tests only
npm test test/event.test.js

# Create test event
curl -X POST http://localhost:3000/v1/event \
  -H "Content-Type: application/json" \
  -H "x-access-token: YOUR_TOKEN" \
  -d '{"name":"Test Event","categories":["music"],"location":{"type":"Point","coordinates":[0,0]}}'
```

3. Ticket Tests:

```bash
# Run ticket tests only
npm test test/ticket.test.js

# Test ticket minting
curl -X POST http://localhost:3000/v1/tickets/mint \
  -H "Content-Type: application/json" \
  -H "x-access-token: YOUR_TOKEN" \
  -d '{"eventId":"EVENT_ID","ticketData":{"ticketType":"VIP","seatNumber":"A1","price":100000000}}'
```

### Contract Testing Commands

1. Local Testing:

```bash
# Start local validator
solana-test-validator

# Run all contract tests
anchor test

# Run specific test
anchor test tests/specific-test.ts

# Run tests with logs
anchor test --verbose
```

2. Program Testing:

```bash
# Build and deploy to localnet
anchor localnet

# Run program tests with custom keypair
anchor test --keypair path/to/keypair.json

# Clean and rebuild
anchor clean
anchor build
```

## Monitoring on Devnet

### Solana Explorer Links

1. Program/Transaction Monitoring:

```
# View your program on Solana Explorer (Devnet)
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet

# View specific transaction
https://explorer.solana.com/tx/TRANSACTION_SIGNATURE?cluster=devnet

# View ticket account
https://explorer.solana.com/address/TICKET_ADDRESS?cluster=devnet
```

### Useful Monitoring Commands

```bash
# Get your program ID
solana address -k target/deploy/ticket_resell-keypair.json

# Monitor program logs in real-time
solana logs YOUR_PROGRAM_ID --url devnet

# Get program account info
solana account YOUR_PROGRAM_ID --url devnet
```

### Quick Access Links

1. Program Status:

   - Program Page: `https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet`
   - Program Data: `https://explorer.solana.com/address/YOUR_PROGRAM_ID/anchor-program?cluster=devnet`

2. Transaction History:

   - Recent Activity: `https://explorer.solana.com/address/YOUR_PROGRAM_ID/transactions?cluster=devnet`
   - Specific Transaction: `https://explorer.solana.com/tx/TRANSACTION_SIGNATURE?cluster=devnet`

3. Account Information:
   - Ticket Account: `https://explorer.solana.com/address/TICKET_ADDRESS?cluster=devnet`
   - Token Account: `https://explorer.solana.com/address/TOKEN_ADDRESS?cluster=devnet`

### Alternative Explorers

1. Solscan:

   - Program: `https://solscan.io/account/YOUR_PROGRAM_ID?cluster=devnet`
   - Transaction: `https://solscan.io/tx/TRANSACTION_SIGNATURE?cluster=devnet`

2. Solana Beach:
   - Program: `https://solanabeach.io/address/YOUR_PROGRAM_ID?cluster=devnet`

### Monitoring Tips

1. Real-time Monitoring:

```bash
# Watch program logs
watch -n 1 "solana logs YOUR_PROGRAM_ID --url devnet"

# Monitor account changes
watch -n 1 "solana account YOUR_PROGRAM_ID --url devnet"
```

2. Transaction Verification:

```bash
# Verify transaction
solana confirm -v TRANSACTION_SIGNATURE --url devnet

# Get transaction details
solana transaction-history YOUR_PROGRAM_ID --url devnet
```

3. Account Management:

```bash
# List all program accounts
solana program show --programs --url devnet

# Get account balance
solana balance YOUR_PROGRAM_ID --url devnet
```

### Development Tools

1. Anchor CLI:

```bash
# View program IDL
anchor idl show YOUR_PROGRAM_ID --provider.cluster devnet

# Fetch program upgrade authority
anchor program show-upgrade-authority YOUR_PROGRAM_ID --provider.cluster devnet
```

2. Program Interaction:

```bash
# Call program instruction (example)
anchor call YOUR_PROGRAM_ID mint_ticket '{"ticketData": "example"}' --provider.cluster devnet
```
