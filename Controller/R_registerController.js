const R_register = require('../models/R_registerModel');
const User = require('../models/U_loginModel')
const geolib = require('geolib');
const bag_rest = require('../models/bagsModel')
const fs = require('fs');
const Order = require('../models/OrderModel')

const sendMail = require("../middleware/mailsent");




const handleResponseAndFileDeletion = (res, file, message, success) => {
    if (file) {
        fs.unlinkSync(file.path);
        console.log('File deleted due to database error:', file.path);
    }

    res.status(400).json({
        success: false,
        message,
    });
};

exports.restRegister = async (req, res) => {
    try {
        const email = req.body.email;
        const contactNo = req.body.contactNo;

        const existUser = await R_register.findOne({ email: email });
        const existCont = await R_register.findOne({ contactNo: contactNo });

        if (existUser && existCont) {
            handleResponseAndFileDeletion(res, req.file, "Email and phone already exist", false);
        } else if (existUser) {
            handleResponseAndFileDeletion(res, req.file, "Email already exists", false);
        } else if (existCont) {
            handleResponseAndFileDeletion(res, req.file, "Phone already exists", false);
        } else {
            const { Latitude, Longitude, ...rest } = req.body;

            const user = await R_register.create({
                ...rest,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(Longitude), parseFloat(Latitude)],
                },
                rest_bannerImg: req.file && req.file.filename,
            });

            res.status(200).json({
                success: true,
                message: "Restaurant registered successfully",
                data: user,
            });
        }
    } catch (err) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
            console.log('File deleted due to database error:', req.file.path);
        }

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


exports.restLogin = async (req, res) => {
    const { contactNo, password } = req.body;

    console.log("123456",contactNo, password);

    try {
        // Find the restaurant user by email
        const restaurant = await R_register.findOne({contactNo:contactNo });
        console.log("🚀 ~ exports.restLogin= ~ restaurant:", restaurant)


        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Compare the provided password with the hashed password
        // const passwordMatch = await bcrypt.compare(password, restaurant.password);

        const isvalid = await restaurant.comparePassword(password); 
        console.log("🚀 ~ exports.restLogin= ~ isvalid:", isvalid)

        if (!isvalid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

     res.status(200).json({
        success:true,
        message:"login successfully :)",
        restaurant:restaurant
     })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRestaurants = async (req, res) => {
    try {
        const { page , limit  } = req.body; 

        const skip = (page - 1) * limit;

        const totalCount = await R_register.countDocuments({
            isDeleted: { $ne: true },
            // verifiedYet: { $ne: false },
            isBanned: { $ne: true },
        });

        const totalPages = Math.ceil(totalCount / limit);

        const restaurants = await R_register.find({
            isDeleted: { $ne: true },
            // verifiedYet: { $ne: false },
            isBanned: { $ne: true },
        }).lean()
            .skip(skip)
            .limit(limit);

            let restaurantIds = await Promise.all(restaurants.map(async (restaurant) => {
                const id = restaurant._id;
                console.log(id,"==================");
                
                try {
                    const existingRestaurant = await bag_rest.find({ rest_id: id }).lean();

                    

                    return {...restaurant, bugs:existingRestaurant };

                } catch (error) {
                    console.error(`Error fetching restaurant with id ${id}:`, error);
                    return null; 
                }
            }));
        
            // Now you have an array of restaurant ids or null values based on success or failure
            console.log(restaurantIds);

        if (!restaurants || restaurants.length === 0) {
            return res.status(200).json({ success: false, message: 'No restaurants found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Restaurants List 🚀',
            data: restaurantIds,
            totalCount,
            totalPages,
            currentPage: page,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
       
};

exports.updateRestaurant = async (req, res) => {
    try {
        const  restaurantId  = req.params.id;
        const otherDetails = req.body;
      
        const modified_date = new Date();

        const existingRestaurant = await R_register.findById(restaurantId);

        if (!existingRestaurant) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant not found',
            });
        }

        const emailExists = await R_register.findOne({ email: otherDetails.email, _id: { $ne: restaurantId } });
        if (emailExists) {
            return res.status(400).json({ status: false, message: 'Email already exists. Choose a different email.' });
        }

        const phoneExists = await R_register.findOne({ contactNo: otherDetails.contactNo, _id: { $ne: restaurantId } });
        if (phoneExists) {
            return res.status(400).json({ status: false, message: 'Phone number already exists. Choose a different phone number.' });
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

exports.DeleteRestaurant = async (req, res) => {
    try {
        const restaurantId = req.params.id;
        
        const existingRestaurant = await R_register.findById(restaurantId);

        if (!existingRestaurant) {
            return res.status(400).json({
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

//search with fillter api -----------------------------------------

// exports.restSearch = async (req, res) => {
//     try {
//         const { searchText } = req.query.search;
//         const { bag_name, bag_type, time } = req.query;

      

//         let currentDate = new Date(); 
//         let tomorrowDate = new Date();
//         tomorrowDate.setDate(currentDate.getDate() + 1); 

//         // Set the time to 24:00:00 for today
//         let todayEnd = new Date(currentDate);
//         todayEnd.setHours(23, 59, 59, 999);

//         let query = {
//             isDeleted: { $ne: true },
//             isBanned: { $ne: true },
//         };

//         let querybag = { isDeleted: { $ne: true } };

//         if (bag_name) {
//             querybag.bag_name = bag_name;
//         }
//         if (bag_type) {
//             querybag.bag_type = bag_type;
//         }

//         if (time === 'today') {
//             // Search bags for today
//             querybag.collection_time = {
//                 $gte: currentDate,
//                 $lte: todayEnd
//             };
//         } else if (time === 'tomorrow') {
//             // Search bags for tomorrow
//             querybag.collection_time = {
//                 $gte: tomorrowDate,
//                 $lte: new Date(tomorrowDate.getFullYear(), tomorrowDate.getMonth(), tomorrowDate.getDate(), 23, 59, 59, 999)
//             };
//         }

//         if (!bag_name && !bag_type && !time) {
//             querybag = { isDeleted: { $ne: true } };
//         }
  

//         if (searchText) {
//             query.rest_name = { $regex: searchText, $options: 'i' };
//         }

//         const restaurants = await R_register.find(query).lean();

      

    
//         let restaurantIds = await Promise.all(restaurants.map(async (restaurant) => {
//             const id = restaurant._id;

//             querybag.rest_id = id;

//             console.log(querybag,"querybag");
           

//             try {
//                 const existingbagRestaurant = await bag_rest.find({...querybag }).lean();

//                 console.log(existingbagRestaurant,"existingbagRestaurant ");

//                 return { ...restaurant, bags: existingbagRestaurant };

//             } catch (error) {
//                 console.error(`Error fetching restaurant with id ${id}:`, error);
//                 return null;
//             }
//         }));

//         if (!restaurants || restaurants.length === 0) {
//             return res.status(200).json({ success: false, message: 'No restaurants found' });
//         }

//         const page = parseInt(req.query.page) || 1;
//         const pageSize = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * pageSize;
//         const total = restaurantIds.length;
//         const totalPages = Math.ceil(total / pageSize);
//         const result = restaurantIds.slice(skip, skip + pageSize);

//         if (page > totalPages) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Data not found',
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "User found search restaurant successfully 🔥",
//             count: result.length,
//             pageSize,
//             page,
//             totalPages,
//             data: result,
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//         });
//     }
// }

// end --------------------------



// without usej of fillter api search -------------------------------
exports.restSearch = async(req , res)=>{
    try {

        const searchText = req.query.search;


        let query = {
            isDeleted: { $ne: true },
            isBanned: { $ne: true },
        };

        if (searchText) {
            query.rest_name = { $regex: searchText, $options: 'i' }; 
        }

        

        const restaurants = await R_register.find(query).lean()
        

            let restaurantIds = await Promise.all(restaurants.map(async (restaurant) => {
                const id = restaurant._id;
    
                
                try {
                    const existingRestaurant = await bag_rest.find({ rest_id: id  ,isDeleted: { $ne: true }}).lean();

                    

                    return {...restaurant, bugs:existingRestaurant };

                } catch (error) {
                    console.error(`Error fetching restaurant with id ${id}:`, error);
                    return null; 
                }
            }));

        if (!restaurants || restaurants.length === 0) {
            return res.status(200).json({ success: false, message: 'No restaurants found' });
        }


        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * pageSize;
        const total =  restaurantIds.length;
        const totalPages = Math.ceil(total / pageSize);
        const result = restaurantIds.slice(skip, skip + pageSize);
    
    
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
        });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
}

exports.restgetOrder = async (req, res) => {
    try {
    
        const rest_id = req.query.rest_id;

        const order = await Order.find({rest_id,isDeleted: { $ne: true }}).lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "that curent time not ordere created "
            });
        }


        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * pageSize;
        const total =  order.length;
        const totalPages = Math.ceil(total / pageSize);
        const result = order.slice(skip, skip + pageSize);

        if (page > totalPages) {
            return res.status(404).json({
              success: false,
              message:'data not found',
            });
          }
          
          res.status(200).json({
            success: true,
            message: "Order listing successful 🔥 ",
            count: result.length,
            pageSize,
            page,
            totalPages,
            data: result
          });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}


exports.sendEmailController = async(req, res) => {
    try{

    const subject = req.body.subject;
    const email = req.body.email;
    const text = req.body.text;
    const html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Your Brand</a>
      </div>
      <p style="font-size:1.1em">${email},</p>
      <p>Thank you for choosing Your Brand. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">324457</h2>
      <p style="font-size:0.9em;">Regards,<br />Your Brand</p>
      <hr style="border:none;border-top:1px solid #eee" />
      <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
        <p>Your Brand Inc</p>
        <p>1600 Amphitheatre Parkway</p>
        <p>${text}</p>
      </div>
    </div>
  </div>`;
  
    
      await sendMail(subject, email, text, html);
      res.send("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).send("Error sending email");
    }
  }

  exports.locationrest= async(req,res) => {
    try {

        const km = req.query.km;
       

        const latitude = req.query.latitude;

        const longitude = req.query.longitude;

       
        const userLocation = {
            latitude,
            longitude
        };

        const restaurants = await R_register.find({
            isDeleted: { $ne: true },
            isBanned: { $ne: true },
        }).lean();

        const nearbyRestaurants = restaurants.filter(restaurant => {
            const restLocation = restaurant.location.coordinates;
            const distance = geolib.getDistance(userLocation, {
                latitude: restLocation[1],
                longitude: restLocation[0]
            });
            return distance <= km * 1000; // Convert km to meters
        });
        res.status(200).json({
            success:true,
            message:`User within ${km} km of restaurants found successfully 🔥`,
             data:nearbyRestaurants
        })
        
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success:false,
            message: "Internal server error"
        })
        
    }
}  


// exports.locationrest = async(req,res) => {
//     try {

//         const km = req.query.km;
//         const userId = req.query.id;

//         const user = await User.findById(userId);
//         const userLocation = {
//             latitude: user.location.coordinates[1],
//             longitude: user.location.coordinates[0]
//         };

//         const restaurants = await R_register.find({
//             isDeleted: { $ne: true },
//             isBanned: { $ne: true },
//         }).lean();

//         const nearbyRestaurants = restaurants.filter(restaurant => {
//             const restLocation = restaurant.location.coordinates;
//             const distance = geolib.getDistance(userLocation, {
//                 latitude: restLocation[1],
//                 longitude: restLocation[0]
//             });
//             return distance <= km * 1000; // Convert km to meters
//         });
//         res.status(200).json({
//             success:true,
//             message:`User within ${km} km of restaurants found successfully 🔥`,
//              data:nearbyRestaurants
//         })
        
//     } catch (error) {
//         console.log(error);
//         res.status(500).send({
//             success:false,
//             message: "Internal server error"
//         })
        
//     }
// }    
