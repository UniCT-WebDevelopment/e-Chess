const mongoose = require("mongoose");

const UserModelSchema = new mongoose.Schema({
    name: String,
    surname: String,
    username: String,
    password: String,
    score: Number
});

var UserModel = mongoose.model("users", UserModelSchema);

module.exports = UserModel;


