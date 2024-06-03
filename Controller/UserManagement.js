const U_login = require('../models/U_loginModel');
const fs = require('fs');
const geolib = require('geolib');

exports.getUsers = async(req,res) => {

    try {

      const getusers = await U_login.find().lean()
        
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * pageSize;
        const total =  getusers.length;
        const totalPages = Math.ceil(total / pageSize);
        const result = getusers.slice(skip, skip + pageSize);

            
        if (result.lengt === 0) {
          return res.status(200).json({
            success: false,
            message:'data not found',
          });
        }
        
    
    
        if (page > totalPages) {
          return res.status(404).json({
            success: false,
            message:'data not found',
          });
        }
        
        res.status(200).json({
          success: true,
          message: "user find search restaurant successfully 🔥",
          count: result.length,
          pageSize,
          page,
          totalPages,
          data: result,
        })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message: 'Internal Server Error'
        })
        
    }

}

exports.UserdetailsUpdate = async (req, res) => {
  try {
      const userId = req.query.id;
      const otherDetails = req.body;
      const modified_date = new Date();

      console.log(req.body);

      const existingUser = await U_login.findById(userId);

      if (!existingUser) {
          return res.status(200).json({
              success: false,
              message: 'User not found',
          });
      }

      // Check if email already exists
      const emailExists = await U_login.findOne({ email: otherDetails.email, _id: { $ne: userId } });
      if (emailExists) {
          return res.status(200).json({ status: false, message: 'Email already exists. Choose a different email.' });
      }

      // Check if phone number already exists
      const phoneExists = await U_login.findOne({ phonenumber: otherDetails.phonenumber, _id: { $ne: userId } });
      if (phoneExists) {
          return res.status(200).json({ status: false, message: 'Phone number already exists. Choose a different phone number.' });
      }

      let updatedUser;

      if (req.file) {
          // Handle file upload
          if (existingUser.Image && fs.existsSync(existingUser.Image)) {
              try {
                  fs.unlinkSync(existingUser.Image);
                  console.log('File deleted successfully');
              } catch (unlinkError) {
                  console.error('Error deleting file:', existingUser.Image, unlinkError);
              }
          }
          updatedUser = await U_login.findOneAndUpdate(
              { _id: userId },
              {
                  ...req.body,
                  Image: req.file.filename,
                  updatedAt: modified_date,
              },
              { new: true }
          ).lean();
      } else {
          // No new file upload
          updatedUser = await U_login.findOneAndUpdate(
              { _id: userId },
              {
                  ...req.body,
                  updatedAt: modified_date,
              },
              { new: true }
          ).lean();
      }

      return res.status(200).json({
          status: true,
          message: 'User details updated successfully',
          data: [updatedUser],
      });
  } catch (err) {
      if (req.file) {
          fs.unlinkSync(req.file.path);
          console.error('Error deleting uploaded file:', req.file.path, err);
      }
      console.log(err);

      res.status(500).json({
          success: false,
          message: 'Internal server error',
      });
  }
};

exports.DeleteUsers = async (req, res) => {
  try {
      const userId = req.query.id;
      
      const existinguser = await U_login.findById(userId);

      if (!existinguser) {
          return res.status(200).json({
              status: false,
              message: 'user not found',
          });
      }
      existinguser.isDeleted = true;
      await existinguser.save();

      return res.status(200).json({
          status: true,
          message: 'user deleted successfully',
      });
  } catch (error) {
      console.error("Error in DeleteRestaurant:", error);

      return res.status(500).json({
          status: false,
          message: 'Internal server error',
      });
  }
};


