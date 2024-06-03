const express = require('express');
const Router = express.Router();
const uploadMiddleware = require('../middleware/fileUpload');

const {OrderCreate,getOrder, YourImpect}=require('../Controller/OrderController')

Router.post('/create/Order',OrderCreate)

Router.get('/get/Order',getOrder)

Router.get('/get/YourImpect',YourImpect)


module.exports = Router;
