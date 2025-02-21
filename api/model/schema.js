var Schema = require("mongoose").Schema;

var eventSchema = new Schema(
  {
    name: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    categories: [String],
    media: String,
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
  },
  { _id: true }
);

var userSchema = new Schema({
  username: { type: String, unique: true },
  password: String,
  email: String,
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

var txnSchema = new Schema({
  amount: { type: Number, default: 0 },
  type: { type: String, enum: ["MINT", "TRANSFER", "RESELL"], required: true },
  eventId: { type: Schema.Types.ObjectId, ref: "Event" },
  ticketAddress: { type: String, required: true },
  signature: { type: String, required: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

module.exports = {
  eventSchema,
  userSchema,
  txnSchema,
};
