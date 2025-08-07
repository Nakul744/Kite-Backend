
const { UserSchema } = require("../schemas/UserSchema");
const mongoose = require("mongoose");

const UserModel = mongoose.model("users", UserSchema);


module.exports = { UserModel };