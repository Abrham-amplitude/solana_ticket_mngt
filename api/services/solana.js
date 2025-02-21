const {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
} = require("@solana/web3.js");
const { AnchorProvider, Program, BN } = require("@coral-xyz/anchor");
const { Wallet } = require("@coral-xyz/anchor");
const bs58 = require("bs58");
const idl = require("../idl");

class SolanaService {
  constructor() {
    try {
      this.connection = new Connection(process.env.SOLANA_RPC_URL, "confirmed");
      this.programId = new PublicKey(process.env.PROGRAM_ID);

      // Initialize payer from environment secret key
      let secretKey;
      try {
        // First try to decode as base58
        secretKey = bs58.decode(process.env.SECRET_KEY);
      } catch (e) {
        // If that fails, try parsing as a comma-separated array
        secretKey = Uint8Array.from(
          process.env.SECRET_KEY.split(",").map((num) => parseInt(num))
        );
      }

      this.payer = Keypair.fromSecretKey(secretKey);
      console.log(
        "Initialized with public key:",
        this.payer.publicKey.toString()
      );

      // Create wallet adapter
      const wallet = new Wallet(this.payer);

      // Create provider
      this.provider = new AnchorProvider(
        this.connection,
        wallet,
        AnchorProvider.defaultOptions()
      );

      // Initialize program
      this.program = new Program(idl, this.programId, this.provider);
    } catch (error) {
      console.error("Error initializing SolanaService:", error);
      throw error;
    }
  }

  async mintTicket(ticketData) {
    try {
      const ticketKeypair = Keypair.generate();
      console.log(
        "Generated ticket keypair:",
        ticketKeypair.publicKey.toString()
      );

      const tx = await this.program.methods
        .mintTicket(JSON.stringify(ticketData))
        .accounts({
          userWallet: this.payer.publicKey,
          ticketAccount: ticketKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([this.payer, ticketKeypair])
        .rpc();

      await this.connection.confirmTransaction(tx);
      console.log("Mint transaction confirmed:", tx);
      console.log("Ticket public key:", ticketKeypair.publicKey.toBase58());

      return {
        success: true,
        signature: tx,
        ticketAddress: ticketKeypair.publicKey.toBase58(),
      };
    } catch (error) {
      console.error("Error minting ticket:", error);
      throw error;
    }
  }

  async getTicket(ticketAddress) {
    try {
      const ticketPubkey = new PublicKey(ticketAddress);
      const ticketAccount = await this.program.account.ticket.fetch(
        ticketPubkey
      );

      return {
        owner: ticketAccount.owner.toString(),
        metadata: JSON.parse(ticketAccount.metadata),
        price: ticketAccount.price.toString(),
      };
    } catch (error) {
      console.error("Error fetching ticket:", error);
      throw error;
    }
  }

  async listTicketForResale(ticketAddress, price) {
    try {
      const ticketPubkey = new PublicKey(ticketAddress);
      const priceInLamports = new BN(price);

      const tx = await this.program.methods
        .listTicketForResell(priceInLamports)
        .accounts({
          userWallet: this.payer.publicKey,
          ticketAccount: ticketPubkey,
        })
        .signers([this.payer])
        .rpc();

      await this.connection.confirmTransaction(tx);

      return {
        success: true,
        signature: tx,
      };
    } catch (error) {
      console.error("Error listing ticket:", error);
      throw error;
    }
  }

  async transferTicket(ticketAddress, newOwnerAddress, buyerKeypair = null) {
    try {
      const ticketPubkey = new PublicKey(ticketAddress);
      const newOwner = new PublicKey(newOwnerAddress);

      // If no buyer keypair is provided, create a temporary one for testing
      const buyer = buyerKeypair || Keypair.generate();

      const tx = await this.program.methods
        .transferTicket(newOwner)
        .accounts({
          sellerWallet: this.payer.publicKey,
          ticketAccount: ticketPubkey,
          buyerWallet: buyer.publicKey,
        })
        .signers([this.payer, buyer])
        .rpc();

      await this.connection.confirmTransaction(tx);

      return {
        success: true,
        signature: tx,
        buyerPublicKey: buyer.publicKey.toString(),
      };
    } catch (error) {
      console.error("Error transferring ticket:", error);
      throw error;
    }
  }
}

module.exports = new SolanaService();
