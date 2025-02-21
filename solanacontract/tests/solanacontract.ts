import { 
  Connection, 
  Keypair, 
  LAMPORTS_PER_SOL, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  sendAndConfirmTransaction,
  clusterApiUrl 
} from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";
import { expect } from "chai";
import { readFileSync } from "fs";

// Sample ticket metadata
const SAMPLE_TICKET = {
  eventId: "evt_123",
  eventName: "Mintix Concert 2024",
  ticketType: "VIP",
  seatNumber: "A123",
  price: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL
  validFrom: new Date().toISOString(),
  validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
  status: "ACTIVE"
};

describe("Mintix Solana Contract Tests", () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync("test-wallet.json", "utf-8")))
  );
  const MINIMUM_TEST_BALANCE = 0.001 * LAMPORTS_PER_SOL;

  console.log("Test wallet public key:", payer.publicKey.toBase58());
  console.log("Solana Explorer URL:", `https://explorer.solana.com/address/${payer.publicKey.toBase58()}?cluster=devnet`);

  it("Can connect to devnet", async () => {
    const version = await connection.getVersion();
    console.log("Connection version:", version);
    expect(version["solana-core"]).to.be.a("string");
  });

  it("Test wallet has minimum required SOL", async () => {
    const balance = await connection.getBalance(payer.publicKey);
    console.log("Wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");
    expect(balance).to.be.greaterThan(MINIMUM_TEST_BALANCE);
  });

  it("Can create a new wallet", () => {
    const newWallet = Keypair.generate();
    console.log("New wallet public key:", newWallet.publicKey.toBase58());
    console.log("New wallet Explorer URL:", `https://explorer.solana.com/address/${newWallet.publicKey.toBase58()}?cluster=devnet`);
    expect(newWallet.publicKey).to.be.instanceOf(PublicKey);
    expect(newWallet.secretKey).to.have.lengthOf(64);
  });

  it("Can transfer SOL between wallets", async () => {
    // Create recipient wallet
    const recipient = Keypair.generate();
    const transferAmount = 0.001 * LAMPORTS_PER_SOL;

    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: recipient.publicKey,
        lamports: transferAmount,
      })
    );

    // Send transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
    console.log("Transfer transaction signature:", signature);
    console.log("Transaction Explorer URL:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    // Verify transfer
    const recipientBalance = await connection.getBalance(recipient.publicKey);
    expect(recipientBalance).to.equal(transferAmount);
  });

  describe("Ticket Operations", () => {
    let ticketAccount: Keypair;
    let buyerWallet: Keypair;

    beforeEach(() => {
      ticketAccount = Keypair.generate();
      buyerWallet = Keypair.generate();
    });

    it("Can create and store ticket metadata", async () => {
      console.log("Creating ticket with metadata:", SAMPLE_TICKET);
      console.log("Ticket Account:", ticketAccount.publicKey.toBase58());
      
      // First, create account and transfer initial rent-exempt balance
      const space = 1000; // Space for metadata
      const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(space);
      
      const createAccountTx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: ticketAccount.publicKey,
          lamports: rentExemptBalance,
          space: space,
          programId: SystemProgram.programId,
        })
      );

      const createSignature = await sendAndConfirmTransaction(
        connection,
        createAccountTx,
        [payer, ticketAccount]
      );

      console.log("Account creation signature:", createSignature);
      console.log("Account Explorer URL:", `https://explorer.solana.com/tx/${createSignature}?cluster=devnet`);

      // Store metadata using SPL Memo Program
      const metadata = {
        ...SAMPLE_TICKET,
        owner: payer.publicKey.toBase58(),
        ticketAccount: ticketAccount.publicKey.toBase58(),
        createdAt: new Date().toISOString()
      };

      const memoTx = new Transaction().add(
        createMemoInstruction(JSON.stringify(metadata))
      );

      const memoSignature = await sendAndConfirmTransaction(
        connection,
        memoTx,
        [payer]
      );

      console.log("Metadata storage signature:", memoSignature);
      console.log("Metadata Explorer URL:", `https://explorer.solana.com/tx/${memoSignature}?cluster=devnet`);
      
      // Verify the account exists
      const accountInfo = await connection.getAccountInfo(ticketAccount.publicKey);
      expect(accountInfo).to.not.be.null;
      expect(accountInfo!.owner.equals(SystemProgram.programId)).to.be.true;
    });

    it("Can transfer ticket ownership", async () => {
      console.log("Transferring ticket to:", buyerWallet.publicKey.toBase58());
      
      // Transfer ownership by sending a small amount of SOL with metadata
      const transferAmount = 0.001 * LAMPORTS_PER_SOL;
      const metadata = {
        action: "TRANSFER_TICKET",
        ticketId: ticketAccount.publicKey.toBase58(),
        from: payer.publicKey.toBase58(),
        to: buyerWallet.publicKey.toBase58(),
        timestamp: new Date().toISOString()
      };

      const transferTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: buyerWallet.publicKey,
          lamports: transferAmount,
        }),
        createMemoInstruction(JSON.stringify(metadata))
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transferTx,
        [payer]
      );

      console.log("Transfer signature:", signature);
      console.log("Transfer Explorer URL:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`);

      // Now you can view the metadata on Solana Explorer by:
      // 1. Click on the transaction URL
      // 2. Look for "Program Logs" in the transaction details
      // 3. The metadata will be visible in the logs as a memo
    });
  });
});
