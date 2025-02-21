var mongoose = require('mongoose');
const schema = require("./schema");

var DB_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/mintix";
mongoose.connect(DB_URL);

exports.Event = mongoose.model("Event", schema.eventSchema);
exports.User = mongoose.model("User", schema.userSchema);
exports.Transaction = mongoose.model("Transaction", schema.txnSchema);