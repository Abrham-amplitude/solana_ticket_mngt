# Ticket Management System API Documentation

## Overview

This API provides endpoints for managing tickets on the Solana blockchain. It includes functionality for user authentication, event management, and ticket operations (minting, listing, and transferring).

## Base URL

- Development: `http://localhost:3000`
- Devnet: `https://api.devnet.example.com`

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the `x-access-token` header for protected endpoints.

### Signup

Create a new user account.

```http
POST /auth/signup
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass",
  "email": "test@example.com"
}
```

Response:

```json
{
  "success": true,
  "message": "User created successfully"
}
```

### Login

Authenticate and receive an access token.

```http
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass"
}
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Events

### List Events

Get a paginated list of events.

```http
GET /v1/events?limit=10&page=1
x-access-token: YOUR_TOKEN
```

Response:

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Concert Event",
    "categories": ["music", "live"],
    "location": {
      "type": "Point",
      "coordinates": [0, 0]
    },
    "media": "event-image.jpg",
    "created": "2024-02-20T12:00:00Z",
    "updated": "2024-02-20T12:00:00Z"
  }
]
```

### Create Event

Create a new event.

```http
POST /v1/event
Content-Type: application/json
x-access-token: YOUR_TOKEN

{
  "name": "Concert Event",
  "categories": ["music"],
  "location": {
    "type": "Point",
    "coordinates": [0, 0]
  },
  "media": "event-image.jpg"
}
```

Response:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Concert Event",
  "categories": ["music"],
  "location": {
    "type": "Point",
    "coordinates": [0, 0]
  },
  "media": "event-image.jpg",
  "created": "2024-02-20T12:00:00Z",
  "updated": "2024-02-20T12:00:00Z"
}
```

## Tickets

### Mint Ticket

Create a new ticket on the Solana blockchain.

```http
POST /v1/tickets/mint
Content-Type: application/json
x-access-token: YOUR_TOKEN

{
  "eventId": "507f1f77bcf86cd799439011",
  "ticketData": {
    "ticketType": "VIP",
    "seatNumber": "A1",
    "price": 100000000
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "ticketAddress": "7cX157TUpYi9MA3T8n2PrjVKeywzx8NX3SLfJVh11jup",
    "signature": "5Netfdf3..."
  }
}
```

### Get Ticket Details

Retrieve ticket details from the Solana blockchain.

```http
GET /v1/tickets/7cX157TUpYi9MA3T8n2PrjVKeywzx8NX3SLfJVh11jup
```

Response:

```json
{
  "success": true,
  "data": {
    "owner": "7cX157TUpYi9MA3T8n2PrjVKeywzx8NX3SLfJVh11jup",
    "metadata": {
      "name": "VIP Concert Ticket",
      "description": "VIP access to main concert",
      "attributes": [
        {
          "trait_type": "Tier",
          "value": "VIP"
        }
      ]
    },
    "price": "100000000"
  }
}
```

### List Ticket for Resale

List a ticket for resale with a specified price.

```http
POST /v1/tickets/7cX157TUpYi9MA3T8n2PrjVKeywzx8NX3SLfJVh11jup/list
Content-Type: application/json
x-access-token: YOUR_TOKEN

{
  "price": 150000000
}
```

Response:

```json
{
  "success": true,
  "data": {
    "signature": "5Netfdf3..."
  }
}
```

### Transfer Ticket

Transfer a ticket to a new owner.

```http
POST /v1/tickets/7cX157TUpYi9MA3T8n2PrjVKeywzx8NX3SLfJVh11jup/transfer
Content-Type: application/json
x-access-token: YOUR_TOKEN

{
  "newOwner": "7cX157TUpYi9MA3T8n2PrjVKeywzx8NX3SLfJVh11jup",
  "buyerSecretKey": "224,21,183,39,..."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "signature": "5Netfdf3...",
    "newOwner": "7cX157TUpYi9MA3T8n2PrjVKeywzx8NX3SLfJVh11jup",
    "buyerPublicKey": "7cX157TUpYi9MA3T8n2PrjVKeywzx8NX3SLfJVh11jup"
  }
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

Common HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse. Limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Testing

1. Import the Postman collection from `postman_collection.json`
2. Set up environment variables in Postman:

   - `baseUrl`: Your API base URL
   - `authToken`: JWT token from login
   - `eventId`: ID of a created event
   - `ticketAddress`: Address of a minted ticket
   - `newOwnerPublicKey`: Public key for transfer test
   - `buyerSecretKey`: Secret key for transfer test

3. Run the collection to test all endpoints

## Blockchain Integration

The API interacts with the Solana blockchain using the following program:

- Program ID: `2mUirJGwKfWUtbqJkgLxPqWDJ5dsi66MYs9CmpZ4ZSGV`
- Network: Devnet

You can monitor transactions on:

- [Solana Explorer](https://explorer.solana.com/address/2mUirJGwKfWUtbqJkgLxPqWDJ5dsi66MYs9CmpZ4ZSGV?cluster=devnet)
- [Solscan](https://solscan.io/account/2mUirJGwKfWUtbqJkgLxPqWDJ5dsi66MYs9CmpZ4ZSGV?cluster=devnet)

## Security Considerations

1. Never share your secret keys or JWT tokens
2. Use HTTPS in production
3. Implement proper input validation
4. Monitor for suspicious activity
5. Keep dependencies updated
