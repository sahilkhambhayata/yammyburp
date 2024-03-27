const express = require('express');
const Router = express.Router();
const uploadMiddleware = require('../middleware/fileUpload');

const {
    restRegister,
    getRestaurants,
    updateRestaurant,
    DeleteRestaurant,
    restLogin,
    restSearch,
    restgetOrder,
    locationrest,
    sendEmailController,
    YourImpect
}=require('../restaurantController/R_registerController')


Router.post('/rest/register',uploadMiddleware,restRegister)
Router.post('/rest/get',getRestaurants)
Router.put('/rest/updated/:id',uploadMiddleware,updateRestaurant)
Router.delete('/rest/delete/:id',DeleteRestaurant)
Router.post('/rest/Login',restLogin)
Router.get('/rest/Search',restSearch)
Router.get('/rest/getOrder',restgetOrder)
Router.get('/get/restLocation',locationrest)
Router.post('/sendEmailController',sendEmailController)



module.exports = Router;
