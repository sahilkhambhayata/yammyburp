const express = require('express');
const Router = express.Router();

const uploadMiddleware = require('../middleware/fileUpload');


const upload = require("../middleware/fileUpload");


const {getAllRestaurants , RestaurantsUpdate , RestaurantDelete , RestaurantverifiedYet , RestaurantReject} = require("../Controller/RestaurantManagement")

Router.put(
    "/Restaurants/Update",
    upload.single("image"), // Assuming upload is the multer middleware
    RestaurantsUpdate
  );
  



Router.get('/getAllRestaurants',getAllRestaurants)

Router.delete('/RestaurantDelete',RestaurantDelete)

Router.post('/RestaurantverifiedYet',RestaurantverifiedYet)

Router.post('/RestaurantReject',RestaurantReject)





module.exports = Router;