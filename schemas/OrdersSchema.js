
const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrdersSchema = new Schema({
   userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // refers to User model
    required: true,
  },
  name: String,
  qty: Number,
  price: Number,
  mode: String,
});


module.exports = { OrdersSchema };
