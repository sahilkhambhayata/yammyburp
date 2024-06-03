const express = require('express');
const Router = express.Router();

const {
   restaurantsReviews
}=require('../Controller/feedbackController')


Router.post('/create/feedback',restaurantsReviews)



module.exports = Router;
