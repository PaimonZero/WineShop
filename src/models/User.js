const mongoose = require('mongoose'); // Erase if already required
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
    {
        googleId: { type: String, unique: true },
        avatar: { type: String, default: 'https://avatar.iran.liara.run/public/48' },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        mobile: { type: String, required: false, sparse: true, unique: true },
        role: {
            type: String,
            enum: ['customer', 'staff', 'admin'],
            default: 'customer',
        },
        address: {type: Array, default: []}, // [{name, phone, address}]
        cart: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                quantity: { type: Number, default: 1 },
            },
        ],
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
        isBlocked: { type: Boolean, default: false },
        refreshToken: { type: String },
        passwordChangedAt: { type: String },
        passwordResetToken: { type: String },
        passwordResetExpires: { type: String },
    },
    {
        timestamps: true,
    }
);

// Trong model thì ko thể sử dụng arrow function vì nó sẽ không có this
// This function is used to hash the password before saving the user
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = bcrypt.genSaltSync(10);
    this.password = await bcrypt.hashSync(this.password, salt);
});

userSchema.methods = {
    // This function is used to compare the password entered by the user with the hashed password in the database
    isCorrectPassword: async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    },
    createPasswordResetToken: function () {
        const resetToken = crypto.randomBytes(32).toString('hex');
        this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        return resetToken;
    },
};

//Export the model
module.exports = mongoose.model('User', userSchema);
