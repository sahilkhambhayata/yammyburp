const express = require('express');
const Router = express.Router();
const uploadMiddleware = require('../middleware/fileUpload');

const {OrderCreate,getOrder}=require('../UserOrderController/OrderController')

Router.post('/create/Order',OrderCreate)

Router.get('/get/Order',getOrder)


module.exports = Router;
