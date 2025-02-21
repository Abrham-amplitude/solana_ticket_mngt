const axios = require("axios");
const { expect } = require("chai");
const { Keypair } = require("@solana/web3.js");
const mongoose = require("mongoose");
require("dotenv").config();

const API_URL = "http://localhost:3000";
let testTicketAddress;
let testEventId;

describe("Ticket API Tests", () => {
  before(async () => {
    try {
      console.log("Waiting for API to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test API connection first
      const response = await axios.get(API_URL);
      console.log("API is ready:", response.data);

      // Create a test event
      const eventData = {
        name: "Test Event",
        categories: ["test"],
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
      };

      // Create event and get MongoDB ObjectId
      const eventResponse = await axios.post(`${API_URL}/v1/event`, eventData);
      testEventId = eventResponse.data._id;
      console.log("Created test event with ID:", testEventId);

      // Small delay to ensure event is properly saved
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error in setup:", error.response?.data || error.message);
      throw error;
    }
  });

  it("should mint a new ticket", async () => {
    try {
      const ticketData = {
        eventId: testEventId,
        ticketData: {
          eventId: testEventId,
          eventName: "Test Concert",
          ticketType: "VIP",
          seatNumber: "A1",
          price: 100,
          validFrom: new Date().toISOString(),
          validUntil: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000
          ).toISOString(),
          metadata: {
            name: "VIP Concert Ticket",
            description: "VIP access to main concert",
            attributes: [
              { trait_type: "Tier", value: "VIP" },
              { trait_type: "Section", value: "Front" },
            ],
          },
        },
      };

      console.log(
        "Sending mint request with data:",
        JSON.stringify(ticketData, null, 2)
      );
      const response = await axios.post(
        `${API_URL}/v1/tickets/mint`,
        ticketData
      );
      console.log("Mint response:", response.data);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.ticketAddress).to.be.a("string");

      testTicketAddress = response.data.data.ticketAddress;
      console.log("Ticket minted at address:", testTicketAddress);

      // Wait for blockchain confirmation
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Mint test failed:", error.response?.data || error.message);
      throw error;
    }
  });

  it("should get ticket details", async () => {
    try {
      console.log("Fetching ticket details for address:", testTicketAddress);
      const response = await axios.get(
        `${API_URL}/v1/tickets/${testTicketAddress}`
      );
      console.log("Ticket details response:", response.data);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.owner).to.be.a("string");
      expect(response.data.data.metadata).to.be.an("object");
    } catch (error) {
      console.error(
        "Get ticket test failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  });

  it("should list ticket for resale", async () => {
    try {
      const listingData = { price: "150" };
      console.log("Listing ticket for resale:", testTicketAddress, listingData);

      const response = await axios.post(
        `${API_URL}/v1/tickets/${testTicketAddress}/list`,
        listingData
      );
      console.log("List response:", response.data);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.signature).to.be.a("string");
    } catch (error) {
      console.error(
        "List ticket test failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  });

  it("should transfer ticket to new owner", async () => {
    try {
      // Wait for previous operations to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newOwner = Keypair.generate();
      const buyer = Keypair.generate();
      console.log(
        "Transferring ticket to new owner:",
        newOwner.publicKey.toString()
      );
      console.log("Using buyer:", buyer.publicKey.toString());

      const response = await axios.post(
        `${API_URL}/v1/tickets/${testTicketAddress}/transfer`,
        {
          newOwner: newOwner.publicKey.toString(),
          buyerSecretKey: Array.from(buyer.secretKey).toString(),
        }
      );
      console.log("Transfer response:", response.data);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.signature).to.be.a("string");
      expect(response.data.data.buyerPublicKey).to.equal(
        buyer.publicKey.toString()
      );

      // Wait for blockchain confirmation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify the transfer
      const verifyResponse = await axios.get(
        `${API_URL}/v1/tickets/${testTicketAddress}`
      );
      expect(verifyResponse.data.data.owner).to.equal(
        newOwner.publicKey.toString()
      );
    } catch (error) {
      console.error(
        "Transfer test failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  });

  after(async () => {
    // Clean up test event
    if (testEventId) {
      try {
        await axios.delete(`${API_URL}/v1/event/${testEventId}`);
        console.log("Cleaned up test event");
      } catch (error) {
        console.error("Error cleaning up test event:", error.message);
      }
    }
  });
});

// Run tests
if (require.main === module) {
  describe("Running API Tests", () => {
    before(async () => {
      console.log("Starting API tests...");
    });

    require("./api.test.js");

    after(() => {
      console.log("API tests completed!");
    });
  });
}
