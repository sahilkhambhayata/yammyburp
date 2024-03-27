const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');

const OrderSchema = mongoose.Schema({

    Order_type: {
        type: String,
    },
    price: {
        type: Number,
    },
    otp: {
        type: String
    },
    Discount: {
        type: Number,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    bag_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'bags',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rest_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'R_register',
        required: true
    },
}, { timestamps: true });


const User_OrderSchema = mongoose.model('orders', OrderSchema);


module.exports = User_OrderSchema;
