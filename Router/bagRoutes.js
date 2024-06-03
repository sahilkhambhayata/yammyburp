const express = require('express');
const Router = express.Router();

const {
    createBag,
    getBag,
    getsinglebag,
    restBag,
    bagrestsearch
}=require('../Controller/bagController')

Router.post('/create/bag',createBag)

Router.get('/rest/Bag',restBag)

Router.get('/get/bag',getBag)

Router.get('/get/singlebag',getsinglebag)


Router.get('/search/restbags',bagrestsearch)

module.exports = Router;
