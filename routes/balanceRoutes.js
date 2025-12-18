const express = require("express")
const router = express.Router()
const Balance = require("../models/Balance")
const Settlement = require("../models/Settlement")
const Group = require("../models/Group")
const balanceService = require("../services/balanceService")

// Get balances for a user in a group
router.get("/user/:userId/group/:groupId", async (req, res, next) => {
  try {
    const { userId, groupId } = req.params

    const balance = await Balance.findOne({ user: userId, group: groupId }).populate("user group")

    if (!balance) {
      return res.json({
        user: userId,
        group: groupId,
        owes: [],
        owedBy: [],
        totalOwed: 0,
        totalOwing: 0,
      })
    }

    const summary = balanceService.getUserBalanceSummary(balance)

    res.json(summary)
  } catch (error) {
    next(error)
  }
})

// Get all balances in a group (simplified)
router.get("/group/:groupId", async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)

    if (!group) {
      return res.status(404).json({ error: "Group not found" })
    }

    const balances = await Balance.find({ group: req.params.groupId }).populate("user")

    // Calculate simplified transactions
    const simplifiedTransactions = balanceService.simplifyBalances(balances)

    res.json({
      group: req.params.groupId,
      balances: balances.map((b) => ({
        user: b.user,
        balances: Object.fromEntries(b.balances),
        summary: balanceService.getUserBalanceSummary(b),
      })),
      simplifiedTransactions,
    })
  } catch (error) {
    next(error)
  }
})

// Settle a debt between two users
router.post("/settle", async (req, res, next) => {
  try {
    const { group, paidBy, paidTo, amount } = req.body

    if (!group || !paidBy || !paidTo || !amount) {
      return res.status(400).json({
        error: "group, paidBy, paidTo, and amount are required",
      })
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" })
    }

    if (paidBy === paidTo) {
      return res.status(400).json({ error: "Cannot settle with yourself" })
    }

    // Verify group exists
    const groupDoc = await Group.findById(group)
    if (!groupDoc) {
      return res.status(404).json({ error: "Group not found" })
    }

    // Update balances
    await balanceService.settleBalance(group, paidBy, paidTo, amount)

    // Record settlement
    const settlement = new Settlement({
      group,
      paidBy,
      paidTo,
      amount,
      description: `Settlement: ${paidBy} paid ${paidTo}`,
    })

    await settlement.save()
    await settlement.populate("group paidBy paidTo")

    res.json({
      message: "Settlement recorded successfully",
      settlement,
    })
  } catch (error) {
    next(error)
  }
})

// Get settlement history for a group
router.get("/settlements/group/:groupId", async (req, res, next) => {
  try {
    const settlements = await Settlement.find({ group: req.params.groupId })
      .populate("paidBy paidTo")
      .sort({ createdAt: -1 })

    res.json({ settlements })
  } catch (error) {
    next(error)
  }
})

module.exports = router
