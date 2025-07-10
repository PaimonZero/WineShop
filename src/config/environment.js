// environment.js
require('dotenv').config(); // Load biến môi trường từ .env

const env = {
    MONGODB_URI: process.env.MONGODB_URI,
    DB_NAME: process.env.DB_NAME,
    HOST: process.env.HOST,
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD,
    EMAIL_NAME: process.env.EMAIL_NAME,
    CLIENT_URL: process.env.CLIENT_URL,
    LIMIT_PRODUCT: process.env.LIMIT_PRODUCT,
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
    CLOUDINARY_KEY: process.env.CLOUDINARY_KEY,
    CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET || 'your_secret_key',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your_client_id',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'your_client_secret',
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
};

module.exports = env;
