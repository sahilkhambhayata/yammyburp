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
    
}=require('../Controller/R_registerController')

const upload = require("../middleware/fileUpload")

Router.post(
    "/rest/register",
    upload.single("image"), // Assuming upload is the multer middleware
    restRegister
  );

  Router.put(
    "/rest/updated/:id",
    upload.single("image"), // Assuming upload is the multer middleware
    updateRestaurant
  );

Router.post('/rest/get',getRestaurants)
Router.delete('/rest/delete/:id',DeleteRestaurant)
Router.post('/rest/Login',restLogin)
Router.get('/rest/Search',restSearch)
Router.get('/rest/getOrder',restgetOrder)
Router.get('/get/restLocation',locationrest)
Router.post('/sendEmailController',sendEmailController)



module.exports = Router;
