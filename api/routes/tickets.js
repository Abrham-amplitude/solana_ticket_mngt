const express = require("express");
const router = express.Router();
const solanaService = require("../services/solana");
const model = require("../model");
const auth = require("../auth");
const mongoose = require("mongoose");
const bs58 = require("bs58");
const { Keypair } = require("@solana/web3.js");

// Mint a new ticket
router.post("/mint", async (req, res) => {
  try {
    const { eventId, ticketData } = req.body;

    if (!ticketData) {
      return res.status(400).json({
        success: false,
        message: "Ticket data is required",
      });
    }

    // Mint ticket on Solana
    const result = await solanaService.mintTicket(ticketData);

    // Save transaction to database
    const transaction = new model.Transaction({
      amount: ticketData.price || 0,
      type: "MINT",
      ticketAddress: result.ticketAddress,
      signature: result.signature,
    });

    // Only add eventId if it's valid
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      transaction.eventId = eventId;
    }

    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Ticket minted successfully",
      data: {
        ticketAddress: result.ticketAddress,
        signature: result.signature,
      },
    });
  } catch (error) {
    console.error("Error in mint endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mint ticket",
      error: error.message,
    });
  }
});

// Get ticket details
router.get("/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const ticket = await solanaService.getTicket(address);

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Error in get ticket endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
});

// List ticket for resale
router.post("/:address/list", async (req, res) => {
  try {
    const { address } = req.params;
    const { price } = req.body;

    if (!price) {
      return res.status(400).json({
        success: false,
        message: "Price is required",
      });
    }

    const result = await solanaService.listTicketForResale(address, price);

    res.status(200).json({
      success: true,
      message: "Ticket listed for resale",
      data: {
        signature: result.signature,
      },
    });
  } catch (error) {
    console.error("Error in list ticket endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list ticket",
      error: error.message,
    });
  }
});

// Transfer ticket
router.post("/:address/transfer", async (req, res) => {
  try {
    const { address } = req.params;
    const { newOwner, buyerSecretKey } = req.body;

    if (!newOwner) {
      return res.status(400).json({
        success: false,
        message: "New owner address is required",
      });
    }

    // Create buyer keypair if secret key is provided
    let buyerKeypair = null;
    if (buyerSecretKey) {
      try {
        let secretKey;
        try {
          secretKey = bs58.decode(buyerSecretKey);
        } catch (e) {
          secretKey = Uint8Array.from(
            buyerSecretKey.split(",").map((num) => parseInt(num.trim()))
          );
        }
        buyerKeypair = Keypair.fromSecretKey(secretKey);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid buyer secret key format",
          error: error.message,
        });
      }
    }

    const result = await solanaService.transferTicket(
      address,
      newOwner,
      buyerKeypair
    );

    // Save transaction to database
    const transaction = new model.Transaction({
      type: "TRANSFER",
      ticketAddress: address,
      signature: result.signature,
    });
    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Ticket transferred successfully",
      data: {
        signature: result.signature,
        newOwner: newOwner,
        buyerPublicKey: result.buyerPublicKey,
      },
    });
  } catch (error) {
    console.error("Error in transfer ticket endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to transfer ticket",
      error: error.message,
    });
  }
});

module.exports = router;
