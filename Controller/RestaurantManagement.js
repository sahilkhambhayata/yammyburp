const R_register = require('../models/R_registerModel');
const geolib = require('geolib');
const fs = require('fs');


exports.getAllRestaurants = async (req, res) => {
    try {
       
        const restaurants = await R_register.find().lean()

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * pageSize;
        const total =  restaurants.length;
        const totalPages = Math.ceil(total / pageSize);
        const result = restaurants.slice(skip, skip + pageSize);

        if (!result || result.length === 0) {
            return res.status(200).json({ success: false, message: 'No restaurants found' });
        }

        if (page > totalPages) {
            return res.status(404).json({
              success: false,
              message:'data not found',
            });
          }
          
          res.status(200).json({
            success: true,
            message: "Restaurants List successfully 🚀🔥",
            count: result.length,
            pageSize,
            page,
            totalPages,
            data: result,
          })


    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
       
};

exports.RestaurantsUpdate = async (req, res) => {
    try {
        const  restaurantId  = req.query.id;
        const otherDetails = req.body;
      
        const modified_date = new Date();

        const existingRestaurant = await R_register.findById(restaurantId);

        if (!existingRestaurant) {
            return res.status(200).json({
                success: false,
                message: 'Restaurant not found',
            });
        }

        const emailExists = await R_register.findOne({ email: otherDetails.email, _id: { $ne: restaurantId } });
        if (emailExists) {
            return res.status(200).json({ status: false, message: 'Email already exists. Choose a different email.' });
        }

        const phoneExists = await R_register.findOne({ contactNo: otherDetails.contactNo, _id: { $ne: restaurantId } });
        if (phoneExists) {
            return res.status(200).json({ status: false, message: 'Phone number already exists. Choose a different phone number.' });
        }

        if (req.file) { // New file upload
            if (existingRestaurant.rest_bannerImg && fs.existsSync(existingRestaurant.rest_bannerImg)) {
                try {
                    fs.unlinkSync(existingRestaurant.rest_bannerImg);
                    console.log('File deleted successfully');
                } catch (unlinkError) {
                    console.error('Error deleting file:', existingRestaurant.rest_bannerImg, unlinkError);
                }
            }
            updatedRestaurant = await R_register.findOneAndUpdate({ _id: restaurantId }, {
                ...req.body,
                rest_bannerImg: req.file && req.file.filename,
                updatedAt: modified_date,
            }, { new: true }).lean();
        
           
        } else { // No new file upload
            updatedRestaurant = await R_register.findOneAndUpdate({ _id: restaurantId }, {
                ...req.body,
                photo: existingRestaurant.rest_bannerImg,
                updatedAt: modified_date,
            }, { new: true }).lean();
        
            console.log('without');
        }
        return res.status(200).json({
            status: true,
            message: 'Restaurant updated successfully',
            data: [updatedRestaurant],
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

exports.RestaurantDelete = async (req, res) => {
    try {
        const restaurantId = req.query.id;
        
        const existingRestaurant = await R_register.findById(restaurantId);

        if (!existingRestaurant) {
            return res.status(200).json({
                status: false,
                message: 'Restaurant not found',
            });
        }
        existingRestaurant.isDeleted = true;
        await existingRestaurant.save();

        return res.status(200).json({
            status: true,
            message: 'Restaurant deleted successfully',
        });
    } catch (error) {
        console.error("Error in DeleteRestaurant:", error);

        return res.status(500).json({
            status: false,
            message: 'Internal server error',
        });
    }
};

exports.RestaurantReject = async (req, res) => {
    try {
        const restaurantId = req.query.id;
        
        const existingRestaurant = await R_register.findById(restaurantId);

        if (!existingRestaurant) {
            return res.status(200).json({
                status: false,
                message: 'Restaurant not found',
            });
        }
        existingRestaurant.isBanned = true;
        await existingRestaurant.save();

        return res.status(200).json({
            status: true,
            message: 'Restaurant Rejected  successfully',
            data:existingRestaurant
        });
    } catch (error) {
        console.error("Error in RejectedRestaurant:", error);

        return res.status(500).json({
            status: false,
            message: 'Internal server error',
        });
    }
};

exports.RestaurantverifiedYet = async (req, res) => {
    try {
        const restaurantId = req.query.id;
        
        const existingRestaurant = await R_register.findById(restaurantId);

        if (!existingRestaurant) {
            return res.status(200).json({
                status: false,
                message: 'Restaurant not found',
            });
        }
        existingRestaurant.verifiedYet = true;
        await existingRestaurant.save();

        return res.status(200).json({
            status: true,
            message: 'Restaurant verifiedYet  successfully',
            data:existingRestaurant
        });
    } catch (error) {
        console.error("Error in verifiedYet Restaurant:", error);

        return res.status(500).json({
            status: false,
            message: 'Internal server error',
        });
    }
};