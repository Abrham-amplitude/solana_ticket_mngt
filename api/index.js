const express = require("express");
const app = express();
const path = require("path");
const logger = require("morgan");
var cookieParser = require("cookie-parser");
require("dotenv").config();
var cors = require("cors");
const PORT = process.env.PORT;
const bs58 = require("bs58");
const routes = require("./routes");
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");
const createError = require("http-errors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
const {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const { AnchorProvider, Program, web3 } = require("@coral-xyz/anchor");
const {
  default: NodeWallet,
} = require("@coral-xyz/anchor/dist/cjs/nodewallet");
const wallet = Keypair.fromSecretKey(
  new Uint8Array([
    224, 21, 183, 39, 191, 83, 67, 47, 13, 4, 254, 245, 245, 200, 190, 249, 190,
    157, 31, 184, 131, 180, 143, 113, 184, 80, 200, 14, 246, 0, 189, 82, 40, 93,
    125, 153, 161, 194, 157, 31, 108, 246, 143, 141, 120, 14, 134, 111, 219, 81,
    197, 189, 171, 224, 115, 162, 203, 111, 96, 35, 198, 152, 96, 138,
  ])
);
const idl = require("./idl");

const connection = new Connection(process.env.SOLANA_RPC_URL, "confirmed");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-type,Accept,X-Access-Token,X-Key"
  );
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("Welcome to Mintix API!!");
});

// app.post("/wallet/create", (req, res) => {
//   const keypair = Keypair.generate();
//   const publicKey = keypair.publicKey.toBase58();
//   const secretKey = keypair.secretKey;
//   console.log(publicKey);
//   console.log(secretKey);

//   res.status(200).send("Key successfully created");
// });

function createWallet() {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const secretKey = keypair.secretKey;
  return { publicKey, secretKey };
}

const sendTransaction = async (transaction) => {
  const keypair = Keypair.fromSecretKey(
    bs58.default.decode(process.env.SECRET_KEY)
  );

  try {
    const transactionSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair]
    );
    return transactionSignature;
  } catch (error) {
    console.log(error);
  }
};

// Transfer SOL to the user using custom program
app.post("/transfer/custom", (req, res) => {
  const { publicKey } = createWallet();
  console.log("Receiving Address : ", publicKey);
  const toPublicKey = new PublicKey(publicKey);

  const nodeWallet = new NodeWallet(wallet);
  const provider = new AnchorProvider(
    connection,
    nodeWallet,
    AnchorProvider.defaultOptions()
  );
  const program = Program.fromIDL(idl, provider);

  const programDataAccount = new PublicKey(process.env.PROGRAM_ID); // Balance : 5 SOL
  console.log("Program Data Account : ", programDataAccount);

  // Use your custom program address here

  const transferInstruction = program.methods
    .list_ticket_for_resell()
    .accounts({
      ticket_account: programDataAccount,
    })
    .instruction();

  // SystemProgram.transfer({
  //   fromPubkey: programDataAccount,
  //   toPubkey: toPublicKey,
  //   lamports: 10_000_000_000,
  // });

  const transaction = new Transaction().add(transferInstruction);
  sendTransaction(transaction)
    .then((transactionSignature) => {
      res.status(200).send("Transaction created : " + transactionSignature);
    })
    .catch((error) => {
      res.status(404).send("Transaction failed : " + error);
    });
});

// Transfering 1 SOL to the user using default system program
app.post("/transfer/sol", (req, res) => {
  const { publicKey } = createWallet();
  console.log("Receiving Address : ", publicKey);
  //const myPublicKey = "E6sPwJXbb3tVg8po43UcFRTk4hjWFvXowf32uRQJtN9Q";
  const toPublicKey = new PublicKey(publicKey);

  const programDataAccount = new PublicKey(
    "9gJrkfjcKFQf86gdTSpVdAZfommSRRsusYbd1fnHPeNb"
  ); // Balance : 5 SOL

  const transferInstruction = SystemProgram.transfer({
    fromPubkey: programDataAccount,
    toPubkey: toPublicKey,
    lamports: 10_000_000_000,
  });
  const transaction = new Transaction().add(transferInstruction);

  sendTransaction(transaction)
    .then((transactionSignature) => {
      res.status(200).send("Transaction created : " + transactionSignature);
    })
    .catch((error) => {
      res.status(404).send("Transaction failed : " + error);
    });
});

// Get ticket details from solana blockchain
app.get("/ticket/:id", (req, res) => {
  const { id } = req.params;
  console.log(id);
  res.status(200).send("Ticket Details from Blockchain");
});

// Verify ticket details from solana blockchain
app.get("/ticket/:id/verify", (req, res) => {
  // Verify ticket details from solana blockchain
  const { id } = req.params;
  console.log(id);
  res.status(200).send("Ticket Details from Blockchain");
});

// Transfer ticket to another user
app.post("/ticket/:id/transfer", (req, res) => {
  // Transfer ticket to another user
  const { id } = req.params;
  console.log(id);
  res.status(200).send("Ticket Transferred");
});

// Mount routes
app.use("/auth", authRoutes);
app.use("/v1", routes);
app.use("/v1/tickets", ticketRoutes);

app.listen(PORT, () => {
  console.log(`Server running on : ${PORT}`);
});

// Error handling
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});
