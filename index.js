require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { HoldingsModel } = require("./models/HoldingsModel");
const { PositionsModel } = require("./models/PositionsModel");
const { OrdersModel } = require("./models/OrdersModel");
const { UserModel } = require("./models/UserModel");

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Optional: To remove deprecation warnings
mongoose.set("strictQuery", false);

// --- MongoDB Connection ---
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Routes ---

// Fetch all holdings
app.get("/allHoldings", async (req, res) => {
  try {
    const holdings = await HoldingsModel.find();
    res.json(holdings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch holdings." });
  }
});

// Fetch all positions
app.get("/allPositions", async (req, res) => {
  try {
    const positions = await PositionsModel.find();
    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch positions." });
  }
});

// Fetch all orders
// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; // user contains { id: user._id, username: user.username }
    next();
  });
}

// Fetch all orders for the authenticated user
app.get("/allorders", authenticateToken, async (req, res) => {
  try {
    const orders = await OrdersModel.find({ userId: req.user.id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders." });
  }
});

// Add new order for the authenticated user
app.post("/newOrder", authenticateToken, async (req, res) => {
  try {
    const { name, qty, price, mode } = req.body;
    const userId = req.user.id; // Get userId from authenticated token

    const newOrder = new OrdersModel({ userId, name, qty, price, mode });
    await newOrder.save();

    res.status(201).json({ message: "Order saved!" });
  } catch (error) {
    console.error("Order Save Error:", error);
    res.status(500).json({ message: "Failed to save order." });
  }
});

// --- Authentication Routes ---

// Register user
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed." });
  }
});

// Login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, userID: user._id });
  } catch (error) {
    res.status(500).json({ message: "Login failed." });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
