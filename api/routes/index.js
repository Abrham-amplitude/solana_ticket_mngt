var express = require("express");
var router = express.Router();
var db = require("../db");

// Events Endpoints
router.get("/events", db.getEvents);
router.get("/event/:id", db.getEventById);
router.post("/event", db.addEvent);
router.put("/event/:id", db.updateEvent);
router.delete("/event/:id", db.deleteEvent);

// Payments Endpoints
router.get("/payments", db.getPayments);
router.get("/payment/:id", db.getPaymentById);
router.post("/payment", db.addPayment);
router.put("/payment/:id", db.updatePayment);
router.delete("/payment/:id", db.deletePayment);

module.exports = router;
