const Bag = require('../models/bagsModel')
const geolib = require('geolib');
const User = require('../models/U_loginModel')
const feedback = require('../models/feedbackModel')
const Order = require('../models/OrderModel')




exports.OrderCreate = async (req, res) => {
    try {

        const OrderData = req.body;

        const order = await Order.create(OrderData);

        res.status(200).json({
            success: true,
            message: "Order Created Suceessfully ",
            data: order

        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });

    }
}

exports.getOrder = async (req, res) => {
    try {
    
        const userId = req.query.userId;

        const order = await Order.find({userId,isDeleted: { $ne: true }}).lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "that curent time not ordere created "
            });
        }

        res.status(200).json({
            success: true,
            message: "Order listing successful",
            data: order
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
    