const mongoose = require("mongoose")

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Amount this participant owes
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // For percentage splits
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { _id: false },
)

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
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
  splitType: {
    type: String,
    enum: ["equal", "exact", "percentage"],
    required: true,
  },
  participants: [participantSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Indexes for faster queries
expenseSchema.index({ group: 1, createdAt: -1 })
expenseSchema.index({ paidBy: 1 })

module.exports = mongoose.model("Expense", expenseSchema)
