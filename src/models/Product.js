const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        description: { type: String, required: true },
        brand: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        sold: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['inStock', 'outOfStock', 'discontinued'],
            default: 'inStock',
        },
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
        images: [{ type: String, required: true }],
        totalRating: { type: Number, default: 0 },
        ratings: [
            {
                star: { type: Number, default: 0 },
                comment: { type: String, default: '' },
                postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

//Export the model
module.exports = mongoose.model('Product', productSchema);
