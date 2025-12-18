const mongoose = require("mongoose")

const settlementSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  paidTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    default: "Settlement",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for settlement history queries
settlementSchema.index({ group: 1, createdAt: -1 })

module.exports = mongoose.model("Settlement", settlementSchema)
