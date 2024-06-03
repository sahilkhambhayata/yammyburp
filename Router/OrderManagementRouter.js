const express = require('express');
const Router = express.Router();

const uploadMiddleware = require('../middleware/fileUpload');

const {getAllOrders}= require('../Controller/OrderManagement')

Router.get('/getAllOrders',getAllOrders);



module.exports = Router;