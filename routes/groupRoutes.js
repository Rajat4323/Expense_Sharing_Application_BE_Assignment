const express = require("express")
const router = express.Router()
const Group = require("../models/Group")
const User = require("../models/User")

// Create a new group
router.post("/", async (req, res, next) => {
  try {
    const { name, description, members, createdBy } = req.body

    if (!name || !createdBy) {
      return res.status(400).json({ error: "Name and createdBy are required" })
    }

    // Verify creator exists
    const creator = await User.findById(createdBy)
    if (!creator) {
      return res.status(404).json({ error: "Creator user not found" })
    }

    // Verify all members exist
    if (members && members.length > 0) {
      const users = await User.find({ _id: { $in: members } })
      if (users.length !== members.length) {
        return res.status(400).json({ error: "One or more member users not found" })
      }
    }

    // Ensure creator is in members list
    const memberSet = new Set(members || [])
    memberSet.add(createdBy)

    const group = new Group({
      name,
      description,
      members: Array.from(memberSet),
      createdBy,
    })

    await group.save()
    await group.populate("members createdBy")

    res.status(201).json({ message: "Group created successfully", group })
  } catch (error) {
    next(error)
  }
})

// Get all groups
router.get("/", async (req, res, next) => {
  try {
    const groups = await Group.find().populate("members createdBy").sort({ createdAt: -1 })
    res.json({ groups })
  } catch (error) {
    next(error)
  }
})

// Get group by ID
router.get("/:id", async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id).populate("members createdBy")

    if (!group) {
      return res.status(404).json({ error: "Group not found" })
    }

    res.json({ group })
  } catch (error) {
    next(error)
  }
})

// Add member to group
router.post("/:id/members", async (req, res, next) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: "userId is required" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const group = await Group.findById(req.params.id)
    if (!group) {
      return res.status(404).json({ error: "Group not found" })
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ error: "User is already a member" })
    }

    group.members.push(userId)
    await group.save()
    await group.populate("members createdBy")

    res.json({ message: "Member added successfully", group })
  } catch (error) {
    next(error)
  }
})

// Remove member from group
router.delete("/:id/members/:userId", async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)

    if (!group) {
      return res.status(404).json({ error: "Group not found" })
    }

    group.members = group.members.filter((memberId) => memberId.toString() !== req.params.userId)

    await group.save()
    await group.populate("members createdBy")

    res.json({ message: "Member removed successfully", group })
  } catch (error) {
    next(error)
  }
})

module.exports = router
