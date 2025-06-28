const mongoose = require("mongoose");
const env = require("@src/config/environment");

const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI);
        if (conn.connection.readyState === 1) {
            console.log("✅ MongoDB connected successfully!");
        } else {
            console.log("🟡 MongoDB connecting...");
        }
    } catch (error) {
        console.error("❌ MongoDB connection failed!", error.message);
        throw new Error(error);
    }
};

module.exports = dbConnect;
