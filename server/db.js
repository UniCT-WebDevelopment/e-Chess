const mongoose = require("mongoose");
const global = require("./config");

const mongoDB = global.DB_CONNECTION;


async function main() {
    await mongoose.connect(mongoDB);

    console.log("db connected");
}



module.exports = main;