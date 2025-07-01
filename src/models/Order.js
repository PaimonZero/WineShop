// const mongoose = require('mongoose'); // Erase if already required

// // Declare the Schema of the Mongo model
// var orderSchema = new mongoose.Schema({
//     products: [
//         {
//             productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//             quantity: { type: Number, required: true, default: 1 },
//         },
//     ],
//     status: {
//         type: String,
//         enum: ['pending', 'shipped', 'delivered', 'cancelled'],
//         default: 'pending',    },
//     paymentIntent: {},
//     orderBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
// });

// //Export the model
// module.exports = mongoose.model('Order', orderSchema);
