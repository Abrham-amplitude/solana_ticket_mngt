const fs = require("fs");
const bs58 = require("bs58");
const path = require("path");

// Read the wallet file path from command line or use default
const walletPath =
  process.argv[2] ||
  process.env.ANCHOR_WALLET ||
  path.join(require("os").homedir(), ".config", "solana", "id.json");

try {
  // Read and parse the wallet file
  const keyData = fs.readFileSync(walletPath);
  const keyArray = JSON.parse(keyData);

  // Convert the array to Uint8Array
  const secretKey = Uint8Array.from(keyArray);

  // Convert to base58
  const base58Key = bs58.encode(secretKey);

  console.log("\nYour wallet public key is:");
  const { Keypair } = require("@solana/web3.js");
  const keypair = Keypair.fromSecretKey(secretKey);
  console.log(keypair.publicKey.toString());

  console.log("\nYour base58 encoded secret key is:");
  console.log(base58Key);
  console.log("\nAdd this to your .env file as:");
  console.log(`SECRET_KEY=${base58Key}`);
} catch (error) {
  console.error("Error reading wallet:", error);
  console.error("Make sure your wallet file exists at:", walletPath);
  process.exit(1);
}
