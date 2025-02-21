const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const model = require("../model");
const { expect } = require("chai");
require("dotenv").config();

const API_URL = `http://localhost:${process.env.PORT}`;
let authToken;
let eventId;
let ticketAddress;

describe("Ticket Management Tests", () => {
  // Setup: Create a test user and event
  before(async () => {
    try {
      // Login or create test user
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        username: "testuser",
        password: "testpass",
      });
      authToken = loginResponse.data.token;

      // Create test event
      const event = new model.Event({
        name: "Test Concert",
        categories: ["music"],
        media: "test.jpg",
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
      });
      await event.save();
      eventId = event._id;
    } catch (error) {
      // If login fails, create new user
      if (error.response && error.response.status === 401) {
        await axios.post(`${API_URL}/auth/signup`, {
          username: "testuser",
          password: "testpass",
          email: "test@example.com",
        });
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          username: "testuser",
          password: "testpass",
        });
        authToken = loginResponse.data.token;
      } else {
        console.error("Setup failed:", error);
        throw error;
      }
    }
  });

  // Test 1: Mint a new ticket
  it("should mint a new ticket", async () => {
    const ticketData = {
      eventId: eventId,
      ticketData: {
        ticketType: "VIP",
        seatNumber: "A1",
        price: 100000000, // 0.1 SOL in lamports
      },
    };

    const response = await axios.post(
      `${API_URL}/v1/tickets/mint`,
      ticketData,
      {
        headers: { "x-access-token": authToken },
      }
    );

    console.log("Mint response:", response.data);
    ticketAddress = response.data.data.ticketAddress;
    console.log("Ticket address:", ticketAddress);

    expect(response.status).to.equal(200);
    expect(response.data.success).to.be.true;
    expect(response.data.data.ticketAddress).to.be.a("string");
    expect(ticketAddress).to.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  });

  // Test 2: Get ticket details
  it("should get ticket details", async () => {
    // Add delay for blockchain confirmation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await axios.get(`${API_URL}/v1/tickets/${ticketAddress}`);
    console.log("Ticket details:", response.data);

    expect(response.status).to.equal(200);
    expect(response.data.success).to.be.true;
    expect(response.data.data).to.have.property("metadata");
    expect(response.data.data).to.have.property("owner");
    expect(response.data.data).to.have.property("price");
  });

  // Test 3: List ticket for resale
  it("should list ticket for resale", async () => {
    const response = await axios.post(
      `${API_URL}/v1/tickets/${ticketAddress}/list`,
      {
        price: 150000000, // 0.15 SOL in lamports
      },
      {
        headers: { "x-access-token": authToken },
      }
    );

    console.log("List response:", response.data);

    expect(response.status).to.equal(200);
    expect(response.data.success).to.be.true;
    expect(response.data.data.signature).to.be.a("string");
  });

  // Test 4: Transfer ticket
  it("should transfer ticket to new owner", async () => {
    // Generate a new wallet for testing transfer
    const { Keypair } = require("@solana/web3.js");
    const newOwner = Keypair.generate();
    const buyer = Keypair.generate();

    const response = await axios.post(
      `${API_URL}/v1/tickets/${ticketAddress}/transfer`,
      {
        newOwner: newOwner.publicKey.toString(),
        buyerSecretKey: Array.from(buyer.secretKey).toString(),
      },
      {
        headers: { "x-access-token": authToken },
      }
    );

    console.log("Transfer response:", response.data);

    expect(response.status).to.equal(200);
    expect(response.data.success).to.be.true;
    expect(response.data.data.signature).to.be.a("string");
    expect(response.data.data.buyerPublicKey).to.equal(
      buyer.publicKey.toString()
    );

    // Add delay for blockchain confirmation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify the transfer
    const verifyResponse = await axios.get(
      `${API_URL}/v1/tickets/${ticketAddress}`
    );
    expect(verifyResponse.data.data.owner).to.equal(
      newOwner.publicKey.toString()
    );
  });

  // Cleanup
  after(async () => {
    try {
      // Clean up test event
      await model.Event.findByIdAndDelete(eventId);
      // Clean up test transactions
      await model.Transaction.deleteMany({ eventId: eventId });
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  });
});
