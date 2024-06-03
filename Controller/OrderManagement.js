const Order = require('../models/OrderModel')

exports.getAllOrders = async (req, res) => {
    try {

        const order = await Order.find().lean();

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * pageSize;
        const total =  order.length;
        const totalPages = Math.ceil(total / pageSize);
        const result = order.slice(skip, skip + pageSize);

        if (!result || result.length === 0) {
            return res.status(200).json({ success: false, message: 'that curent time not ordere created ' });
        }

        if (page > totalPages) {
            return res.status(404).json({
              success: false,
              message:'data not found',
            });
          }
          
          res.status(200).json({
            success: true,
            message: "Order listing successful 🚀🔥",
            count: result.length,
            pageSize,
            page,
            totalPages,
            data: result,
          })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
