const { expect } = require("chai");
const {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
} = require("@solana/web3.js");
const { Program, AnchorProvider, Wallet } = require("@coral-xyz/anchor");
const base58 = require("bs58");
const idl = require("../idl");
const axios = require("axios");
require("dotenv").config();

describe("Ticket Minting Tests", () => {
  let connection;
  let provider;
  let program;
  let payer;
  let authToken;

  before(async () => {
    try {
      // Create test user
      try {
        await axios.post("http://localhost:3000/auth/signup", {
          username: "testuser",
          password: "testpass",
          email: "test@example.com",
        });
      } catch (error) {
        console.log("User might already exist, trying to login");
      }

      // Login to get auth token
      const loginResponse = await axios.post(
        "http://localhost:3000/auth/login",
        {
          username: "testuser",
          password: "testpass",
        }
      );
      authToken = loginResponse.data.token;

      // Initialize connection to devnet
      connection = new Connection(process.env.SOLANA_RPC_URL, "confirmed");

      // Initialize payer from environment secret key
      const secretKey = process.env.SECRET_KEY;
      if (!secretKey) {
        throw new Error("Secret key not found in environment variables");
      }

      try {
        // Try to parse the secret key from the comma-separated array format
        const secretKeyArray = secretKey
          .split(",")
          .map((num) => parseInt(num.trim()));
        payer = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
        console.log("Test wallet public key:", payer.publicKey.toString());
      } catch (error) {
        console.error("Error parsing secret key:", error);
        throw new Error("Invalid secret key format");
      }

      // Create wallet and provider
      const wallet = new Wallet(payer);
      provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
      );

      // Initialize program
      const programId = new PublicKey(process.env.PROGRAM_ID);
      if (!programId) {
        throw new Error("Program ID not found in environment variables");
      }
      program = new Program(idl, programId, provider);

      // Log connection details for debugging
      console.log("Connected to:", process.env.SOLANA_RPC_URL);
      console.log("Program ID:", process.env.PROGRAM_ID);
    } catch (error) {
      console.error("Setup error:", error);
      throw error;
    }
  });

  it("Should mint a new ticket", async () => {
    // Create test ticket data
    const testTicketData = JSON.stringify({
      eventName: "Test Concert",
      ticketType: "VIP",
      seatNumber: "A1",
      price: "100",
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Generate new keypair for ticket account
    const ticketKeypair = Keypair.generate();
    console.log("New ticket account:", ticketKeypair.publicKey.toString());

    try {
      // Call mint_ticket instruction
      const tx = await program.methods
        .mintTicket(testTicketData)
        .accounts({
          userWallet: payer.publicKey,
          ticketAccount: ticketKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer, ticketKeypair])
        .rpc();

      console.log("Transaction signature:", tx);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(tx);
      console.log("Transaction confirmed:", confirmation);

      // Fetch the ticket account data
      const ticketAccount = await program.account.ticket.fetch(
        ticketKeypair.publicKey
      );

      // Verify ticket data
      expect(ticketAccount.owner.toString()).to.equal(
        payer.publicKey.toString()
      );
      expect(ticketAccount.metadata).to.equal(testTicketData);
      expect(ticketAccount.price.toString()).to.equal("0");

      // Store the ticket address for the next test
      global.testTicketAddress = ticketKeypair.publicKey.toString();
    } catch (error) {
      console.error("Error minting ticket:", error);
      throw error;
    }
  });

  it("Should fetch minted ticket details", async () => {
    // Skip if no ticket was minted in the previous test
    if (!global.testTicketAddress) {
      console.log("No ticket address available, skipping fetch test");
      return;
    }

    try {
      const ticketPubkey = new PublicKey(global.testTicketAddress);
      const ticketAccount = await program.account.ticket.fetch(ticketPubkey);

      expect(ticketAccount).to.not.be.null;
      expect(ticketAccount.owner.toString()).to.equal(
        payer.publicKey.toString()
      );

      console.log("Fetched ticket details:", {
        owner: ticketAccount.owner.toString(),
        metadata: ticketAccount.metadata,
        price: ticketAccount.price.toString(),
      });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      throw error;
    }
  });
});
