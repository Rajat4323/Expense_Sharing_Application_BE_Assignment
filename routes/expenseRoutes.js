const express = require("express")
const router = express.Router()
const Expense = require("../models/Expense")
const Group = require("../models/Group")
const expenseService = require("../services/expenseService")

// Create a new expense
router.post("/", async (req, res, next) => {
  try {
    const { description, amount, group, paidBy, splitType, participants } = req.body

    // Validation
    if (!description || !amount || !group || !paidBy || !splitType) {
      return res.status(400).json({
        error: "description, amount, group, paidBy, and splitType are required",
      })
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" })
    }

    // Verify group exists and paidBy is a member
    const groupDoc = await Group.findById(group)
    if (!groupDoc) {
      return res.status(404).json({ error: "Group not found" })
    }

    if (!groupDoc.members.some((m) => m.toString() === paidBy)) {
      return res.status(400).json({ error: "paidBy user must be a member of the group" })
    }

    // Calculate splits based on type
    let calculatedParticipants

    switch (splitType) {
      case "equal":
        calculatedParticipants = expenseService.calculateEqualSplit(
          participants || groupDoc.members.map((m) => m.toString()),
          amount,
        )
        break

      case "exact":
        if (!participants || participants.length === 0) {
          return res.status(400).json({
            error: "participants with amounts are required for exact split",
          })
        }
        calculatedParticipants = expenseService.calculateExactSplit(participants, amount)
        break

      case "percentage":
        if (!participants || participants.length === 0) {
          return res.status(400).json({
            error: "participants with percentages are required for percentage split",
          })
        }
        calculatedParticipants = expenseService.calculatePercentageSplit(participants, amount)
        break

      default:
        return res.status(400).json({
          error: "Invalid splitType. Must be equal, exact, or percentage",
        })
    }

    // Create expense
    const expense = new Expense({
      description,
      amount,
      group,
      paidBy,
      splitType,
      participants: calculatedParticipants,
    })

    await expense.save()

    // Update balances
    await expenseService.updateBalances(expense)

    await expense.populate("group paidBy participants.user")

    res.status(201).json({
      message: "Expense created successfully",
      expense,
    })
  } catch (error) {
    next(error)
  }
})

// Get all expenses for a group
router.get("/group/:groupId", async (req, res, next) => {
  try {
    const expenses = await Expense.find({ group: req.params.groupId })
      .populate("paidBy participants.user")
      .sort({ createdAt: -1 })

    res.json({ expenses })
  } catch (error) {
    next(error)
  }
})

// Get expense by ID
router.get("/:id", async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate("group paidBy participants.user")

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" })
    }

    res.json({ expense })
  } catch (error) {
    next(error)
  }
})

// Delete expense
router.delete("/:id", async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" })
    }

    // Reverse the balance updates
    await expenseService.reverseBalances(expense)

    await Expense.findByIdAndDelete(req.params.id)

    res.json({ message: "Expense deleted successfully" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
