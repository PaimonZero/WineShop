const mongoose = require("mongoose");
const env = require("@src/config/environment");

const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI);
        if (conn.connection.readyState == 1) {
            console.log("DB connection successful!");
        } else {
            console.log("DB connecting!");
        }
    } catch (error) {
        console.log("DB connection failed!");
        throw new Error(error);
    }
};

module.exports = dbConnect;
