const express = require('express');
const Router = express.Router();
const uploadMiddleware = require('../middleware/fileUpload');

const upload = require("../middleware/fileUpload");


const {getUsers , UserdetailsUpdate , DeleteUsers } = require("../Controller/UserManagement")

Router.put(
    "/update/Users",
    upload.single("image"), // Assuming upload is the multer middleware
    UserdetailsUpdate
  );
  



Router.get('/getUsers',getUsers)

Router.delete('/DeleteUsers',DeleteUsers)



module.exports = Router;