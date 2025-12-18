const mongoose = require("mongoose")

const balanceSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Positive means user owes this much, negative means user is owed
  balances: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
})

// Compound index for efficient balance lookups
balanceSchema.index({ group: 1, user: 1 }, { unique: true })

module.exports = mongoose.model("Balance", balanceSchema)
