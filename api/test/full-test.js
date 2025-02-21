const axios = require("axios");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const { Program, AnchorProvider } = require("@coral-xyz/anchor");
require("dotenv").config();

const API_URL = "http://localhost:3000";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runFullTest() {
  try {
    console.log("Starting Full System Test...");

    // 1. Test Minting
    console.log("\n1. Testing Ticket Minting...");
    const ticketData = {
      ticketData: JSON.stringify({
        eventName: "Test Concert",
        date: "2024-12-31",
        seat: "A1",
        price: "100",
        metadata: {
          name: "VIP Concert Ticket",
          description: "VIP access to main concert",
          attributes: [
            { trait_type: "Tier", value: "VIP" },
            { trait_type: "Section", value: "Front" },
          ],
        },
      }),
    };

    const mintResponse = await axios.post(`${API_URL}/ticket/mint`, ticketData);
    console.log("Mint Response:", mintResponse.data);

    if (!mintResponse.data.success) {
      throw new Error("Minting failed");
    }

    const ticketAddress = mintResponse.data.ticketAddress;
    await sleep(2000); // Wait for blockchain confirmation

    // 2. Test Fetching Ticket
    console.log("\n2. Testing Ticket Retrieval...");
    const ticketResponse = await axios.get(
      `${API_URL}/ticket/${ticketAddress}`
    );
    console.log("Ticket Details:", ticketResponse.data);

    // 3. Test Listing Ticket for Resale
    console.log("\n3. Testing Listing Ticket for Resale...");
    const listPrice = 150; // Price in SOL (lamports)
    const listResponse = await axios.post(
      `${API_URL}/ticket/${ticketAddress}/list`,
      { price: listPrice }
    );
    console.log("List Response:", listResponse.data);
    await sleep(2000);

    // 4. Generate a new wallet for transfer test
    const newOwner = Keypair.generate();
    console.log("\n4. Testing Ticket Transfer...");
    const transferResponse = await axios.post(
      `${API_URL}/ticket/${ticketAddress}/transfer`,
      { newOwner: newOwner.publicKey.toString() }
    );
    console.log("Transfer Response:", transferResponse.data);
    await sleep(2000);

    // 5. Verify Transfer
    console.log("\n5. Verifying Transfer...");
    const verifyResponse = await axios.get(
      `${API_URL}/ticket/${ticketAddress}`
    );
    console.log("Final Ticket State:", verifyResponse.data);

    // Verify new owner matches
    const currentOwner = verifyResponse.data.ticket.owner;
    const expectedOwner = newOwner.publicKey.toString();
    console.log("\nOwnership Verification:");
    console.log("Expected Owner:", expectedOwner);
    console.log("Current Owner:", currentOwner);
    console.log(
      "Transfer Successful:",
      currentOwner.toLowerCase() === expectedOwner.toLowerCase()
    );

    // 6. Test Error Cases
    console.log("\n6. Testing Error Cases...");

    // Try to transfer ticket with invalid owner
    try {
      await axios.post(`${API_URL}/ticket/${ticketAddress}/transfer`, {
        newOwner: Keypair.generate().publicKey.toString(),
      });
      console.log("❌ Should have failed: Transfer with invalid owner");
    } catch (error) {
      console.log("✅ Successfully caught invalid owner transfer");
    }

    // Try to mint with invalid data
    try {
      await axios.post(`${API_URL}/ticket/mint`, { invalidData: true });
      console.log("❌ Should have failed: Mint with invalid data");
    } catch (error) {
      console.log("✅ Successfully caught invalid mint data");
    }

    console.log("\nTest Suite Completed Successfully! 🎉");
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test suite
console.log("Starting Full System Test...");
runFullTest().then(() => {
  console.log("\nTest Suite Completed");
  process.exit(0);
});
