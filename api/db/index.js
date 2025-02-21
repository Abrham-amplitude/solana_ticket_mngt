var mongoose = require("mongoose");
var model = require("../model");

module.exports.addEvent = async (req, res, next) => {
  try {
    const { name, media, categories } = req.body;
    var event = new model.Event({
      name,
      media,
      categories,
      created: new Date(),
      updated: new Date(),
    });
    const savedEvent = await event.save();
    res.status(200).json(savedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.getEvents = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const events = await model.Event.find()
      .sort({ created: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(limit) * (parseInt(page) - 1));
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await model.Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.updateEvent = async (req, res, next) => {
  try {
    const { name, media, location, categories } = req.body;
    const { id } = req.params;
    const event = await model.Event.findByIdAndUpdate(
      id,
      {
        name,
        media,
        location,
        categories,
        updated: new Date(),
      },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await model.Event.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.getPayments = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const payments = await model.Transaction.find()
      .sort({ created: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(limit) * (parseInt(page) - 1));
    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await model.Transaction.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.addPayment = async (req, res, next) => {
  try {
    const { amount, type, eventId, ticketAddress, signature } = req.body;
    const payment = new model.Transaction({
      amount,
      type,
      eventId,
      ticketAddress,
      signature,
      created: new Date(),
      updated: new Date(),
    });
    const savedPayment = await payment.save();
    res.status(200).json(savedPayment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.updatePayment = async (req, res, next) => {
  try {
    const { amount, type, eventId, ticketAddress, signature } = req.body;
    const { id } = req.params;
    const payment = await model.Transaction.findByIdAndUpdate(
      id,
      {
        amount,
        type,
        eventId,
        ticketAddress,
        signature,
        updated: new Date(),
      },
      { new: true }
    );
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await model.Transaction.findByIdAndDelete(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
