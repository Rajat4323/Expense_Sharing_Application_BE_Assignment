const express = require("express")
const mongoose = require("mongoose")
const userRoutes = require("./routes/userRoutes")
const groupRoutes = require("./routes/groupRoutes")
const expenseRoutes = require("./routes/expenseRoutes")
const balanceRoutes = require("./routes/balanceRoutes")

const app = express()
const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/expense-sharing"

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Routes
app.use("/api/users", userRoutes)
app.use("/api/groups", groupRoutes)
app.use("/api/expenses", expenseRoutes)
app.use("/api/balances", balanceRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Expense Sharing API is running" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  })

module.exports = app
