const express = require("express")
const router = express.Router()
const User = require("../models/User")

// Create a new user
router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" })
    }

    const user = new User({ name, email, phone })
    await user.save()

    res.status(201).json({ message: "User created successfully", user })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" })
    }
    next(error)
  }
})

// Get all users
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find().sort({ name: 1 })
    res.json({ users })
  } catch (error) {
    next(error)
  }
})

// Get user by ID
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
})

// Update user
router.put("/:id", async (req, res, next) => {
  try {
    const { name, email, phone } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { name, email, phone }, { new: true, runValidators: true })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ message: "User updated successfully", user })
  } catch (error) {
    next(error)
  }
})

// Delete user
router.delete("/:id", async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
