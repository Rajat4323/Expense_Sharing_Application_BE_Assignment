const Balance = require("../models/Balance")

/**
 * Calculate equal split among participants
 */
function calculateEqualSplit(participantIds, totalAmount) {
  const count = participantIds.length
  const amountPerPerson = totalAmount / count

  return participantIds.map((userId) => ({
    user: userId,
    amount: Number.parseFloat(amountPerPerson.toFixed(2)),
  }))
}

/**
 * Calculate exact split with validation
 */
function calculateExactSplit(participants, totalAmount) {
  // Validate that amounts sum to total
  const sum = participants.reduce((acc, p) => acc + p.amount, 0)

  if (Math.abs(sum - totalAmount) > 0.01) {
    throw new Error(`Participant amounts (${sum}) must sum to total amount (${totalAmount})`)
  }

  return participants.map((p) => ({
    user: p.user,
    amount: Number.parseFloat(p.amount.toFixed(2)),
  }))
}

/**
 * Calculate percentage split with validation
 */
function calculatePercentageSplit(participants, totalAmount) {
  // Validate percentages sum to 100
  const totalPercentage = participants.reduce((acc, p) => acc + p.percentage, 0)

  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100, got ${totalPercentage}`)
  }

  return participants.map((p) => ({
    user: p.user,
    amount: Number.parseFloat(((totalAmount * p.percentage) / 100).toFixed(2)),
    percentage: p.percentage,
  }))
}

/**
 * Update balances after an expense is created
 */
async function updateBalances(expense) {
  const { group, paidBy, participants } = expense

  // For each participant, update their balance with paidBy
  for (const participant of participants) {
    const userId = participant.user.toString()
    const amount = participant.amount

    // Skip if user paid for themselves
    if (userId === paidBy.toString()) {
      continue
    }

    // Update participant's balance (they owe paidBy)
    await updateUserBalance(group, userId, paidBy.toString(), amount)
  }
}

/**
 * Reverse balances when an expense is deleted
 */
async function reverseBalances(expense) {
  const { group, paidBy, participants } = expense

  for (const participant of participants) {
    const userId = participant.user.toString()
    const amount = participant.amount

    if (userId === paidBy.toString()) {
      continue
    }

    // Reverse the balance update
    await updateUserBalance(group, userId, paidBy.toString(), -amount)
  }
}

/**
 * Helper to update a single user's balance with another user
 */
async function updateUserBalance(groupId, userId, owedToUserId, amount) {
  // Get or create balance document for user
  let balance = await Balance.findOne({ group: groupId, user: userId })

  if (!balance) {
    balance = new Balance({
      group: groupId,
      user: userId,
      balances: new Map(),
    })
  }

  // Update the balance map
  const currentBalance = balance.balances.get(owedToUserId) || 0
  const newBalance = currentBalance + amount

  if (Math.abs(newBalance) < 0.01) {
    // Remove if balance is effectively zero
    balance.balances.delete(owedToUserId)
  } else {
    balance.balances.set(owedToUserId, Number.parseFloat(newBalance.toFixed(2)))
  }

  balance.lastUpdated = new Date()
  await balance.save()

  // Also update the reverse balance (owedToUser owes negative amount to user)
  let reverseBalance = await Balance.findOne({ group: groupId, user: owedToUserId })

  if (!reverseBalance) {
    reverseBalance = new Balance({
      group: groupId,
      user: owedToUserId,
      balances: new Map(),
    })
  }

  const currentReverseBalance = reverseBalance.balances.get(userId) || 0
  const newReverseBalance = currentReverseBalance - amount

  if (Math.abs(newReverseBalance) < 0.01) {
    reverseBalance.balances.delete(userId)
  } else {
    reverseBalance.balances.set(userId, Number.parseFloat(newReverseBalance.toFixed(2)))
  }

  reverseBalance.lastUpdated = new Date()
  await reverseBalance.save()
}

module.exports = {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  updateBalances,
  reverseBalances,
}
