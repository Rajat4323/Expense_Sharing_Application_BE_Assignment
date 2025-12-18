const Balance = require("../models/Balance")

/**
 * Get a summary of what a user owes and is owed
 */
function getUserBalanceSummary(balance) {
  const owes = []
  const owedBy = []
  let totalOwed = 0
  let totalOwing = 0

  for (const [otherUserId, amount] of balance.balances.entries()) {
    if (amount > 0) {
      // This user owes the other user
      owes.push({ userId: otherUserId, amount })
      totalOwing += amount
    } else if (amount < 0) {
      // The other user owes this user
      owedBy.push({ userId: otherUserId, amount: Math.abs(amount) })
      totalOwed += Math.abs(amount)
    }
  }

  return {
    user: balance.user,
    group: balance.group,
    owes,
    owedBy,
    totalOwed: Number.parseFloat(totalOwed.toFixed(2)),
    totalOwing: Number.parseFloat(totalOwing.toFixed(2)),
    netBalance: Number.parseFloat((totalOwed - totalOwing).toFixed(2)),
  }
}

/**
 * Simplify balances to minimize number of transactions
 * Uses a greedy algorithm to reduce transaction count
 */
function simplifyBalances(balances) {
  // Calculate net balance for each user
  const netBalances = {}

  for (const balance of balances) {
    const userId = balance.user._id.toString()
    netBalances[userId] = 0

    for (const [otherUserId, amount] of balance.balances.entries()) {
      netBalances[userId] -= amount // Negative of what they owe
    }
  }

  // Separate into debtors (negative) and creditors (positive)
  const debtors = []
  const creditors = []

  for (const [userId, netBalance] of Object.entries(netBalances)) {
    if (netBalance < -0.01) {
      debtors.push({ userId, amount: Math.abs(netBalance) })
    } else if (netBalance > 0.01) {
      creditors.push({ userId, amount: netBalance })
    }
  }

  // Sort by amount (largest first) for better optimization
  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  // Greedy matching algorithm
  const transactions = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]

    const settleAmount = Math.min(debtor.amount, creditor.amount)

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Number.parseFloat(settleAmount.toFixed(2)),
    })

    debtor.amount -= settleAmount
    creditor.amount -= settleAmount

    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  return transactions
}

/**
 * Settle a balance between two users
 */
async function settleBalance(groupId, paidByUserId, paidToUserId, amount) {
  // Get balance for paidBy user
  const paidByBalance = await Balance.findOne({
    group: groupId,
    user: paidByUserId,
  })

  if (!paidByBalance) {
    throw new Error("No balance found for paidBy user in this group")
  }

  // Get current balance owed
  const currentOwed = paidByBalance.balances.get(paidToUserId) || 0

  if (currentOwed <= 0) {
    throw new Error("paidBy user does not owe paidTo user")
  }

  if (amount > currentOwed) {
    throw new Error(`Settlement amount (${amount}) exceeds owed amount (${currentOwed})`)
  }

  // Update balances
  const newBalance = currentOwed - amount

  if (Math.abs(newBalance) < 0.01) {
    paidByBalance.balances.delete(paidToUserId)
  } else {
    paidByBalance.balances.set(paidToUserId, Number.parseFloat(newBalance.toFixed(2)))
  }

  paidByBalance.lastUpdated = new Date()
  await paidByBalance.save()

  // Update reverse balance
  const paidToBalance = await Balance.findOne({
    group: groupId,
    user: paidToUserId,
  })

  if (paidToBalance) {
    const currentReverseOwed = paidToBalance.balances.get(paidByUserId) || 0
    const newReverseBalance = currentReverseOwed + amount

    if (Math.abs(newReverseBalance) < 0.01) {
      paidToBalance.balances.delete(paidByUserId)
    } else {
      paidToBalance.balances.set(paidByUserId, Number.parseFloat(newReverseBalance.toFixed(2)))
    }

    paidToBalance.lastUpdated = new Date()
    await paidToBalance.save()
  }
}

module.exports = {
  getUserBalanceSummary,
  simplifyBalances,
  settleBalance,
}
