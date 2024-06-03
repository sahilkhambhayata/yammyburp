const Bag = require('../models/bagsModel')
const User = require('../models/U_loginModel')
const feedback = require('../models/feedbackModel')
const R_register = require('../models/R_registerModel');
const geolib = require('geolib');

exports.createBag = async (req, res) => {
    try {
        const bagData = req.body;

        let prices = req.body.price;

        prices *= 1.25;

        // Round the price before creating the bag
        const price = Math.round(prices);

        // Create the bag with the rounded price
        const bag = await Bag.create({ ...bagData , price});

    
        // Extract the collection time from the request body
        const collectionTime = bagData.collection_time;

      
        // Extract the start and end times from the collection time
        const [startTime, endTime] = collectionTime.split(' - ');

        // Calculate the duration in milliseconds
        const duration = calculateDuration(startTime, endTime);
        
        console.log(duration,"duration");

        // Set a timeout to delete the bag after the specified duration
        setTimeout(async () => {
            try {

                bag.isDeleted = true;
                await bag.save();
                // await Bag.deleteOne({ _id: bag._id });
                console.log(`Bag with ID ${bag._id} deleted after collection time`);

            } catch (error) {
                console.error(`Error deleting bag with ID ${bag._id}:`, error);

            }
        }, duration);

        res.status(200).json({
            success: true,
            message: "bag created successfully",
            data: bag
        })
    } catch (err) {
        console.log(err);
        res.status(400).json({
            success: false,
            message: "internal server error"
        });
    }
}

function calculateDuration(startTime, endTime) {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    let [endHours, endMinutes] = endTime.split(':').map(Number);

    // Adjust end time if it's smaller than start time (indicating it's on the next day)
    if (endHours < startHours || (endHours === startHours && endMinutes < startMinutes)) {
        endHours += 24; // Add 24 hours to end hours
    }

    const startMilliseconds = (startHours * 60 + startMinutes) * 60 * 1000;
    const endMilliseconds = (endHours * 60 + endMinutes) * 60 * 1000;

    return endMilliseconds - startMilliseconds;
}

exports.getBag = async (req, res) => {
    try {
        const userId = req.query.id;
        
        const user = await User.findById(userId);

        const userLocation = {
            latitude: user.location.coordinates[1],
            longitude: user.location.coordinates[0]
        };

        const bags = await Bag.find({isDeleted: { $ne: true }}).populate("rest_id");

        const bagsWithRating = await Promise.all(bags.map(async (bag) => {
            if (!bag.rest_id || !bag.rest_id.location) {
                return null; 
            }
        
            const restLocation = bag.rest_id.location.coordinates;
            const distance = geolib.getDistance(userLocation, {
                latitude: restLocation[1],
                longitude: restLocation[0]
            });
        
            // Fetch feedback for the restaurant
            const ratings = await feedback.find({ restaurant_id: bag.rest_id._id });
            let averageRating = 0;
            if (ratings.length > 0) {
                const sumRating = ratings.reduce((total, rating) => total + rating.rating, 0);
                averageRating = sumRating / ratings.length;
                averageRating = parseFloat(averageRating.toFixed(2));
            }
            
            return {
                ...bag.toObject(),
                distance: distance / 1000,
                averageRating: averageRating
            };
        }));
        
        const validBagsWithRating = bagsWithRating.filter(bag => bag !== null);
        
        res.status(200).json({
            success: true,
            message: "Listing successful",
            data: validBagsWithRating
        });
        
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.getsinglebag = async (req, res) => {
    try {
        const bag_id = req.body.bag_id;

        const userId = req.body.userId;

        const othersbugslimit = req.query.othersbugslimit || 4 ;
        

        console.log(userId,bag_id,"---------------------");
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const userLocation = {
            latitude: user.location.coordinates[1],
            longitude: user.location.coordinates[0]
        };

        const bags = await Bag.findById(bag_id).lean().populate("rest_id");

        const otherbags = await Bag.find({ rest_id: bags.rest_id }).limit(othersbugslimit).lean();

        if (!bags || !bags.rest_id) {
            return res.status(200).json({
                success: false,
                message: "Bag not found or restaurant information missing"
            });
        }

        const restLocation = bags.rest_id.location.coordinates;

        const distance = geolib.getDistance(userLocation, {
            latitude: restLocation[1],
            longitude: restLocation[0]
        });

        const ratings = await feedback.find({ restaurant_id: bags.rest_id._id }).lean();

        let averageRating = 0;
        if (ratings.length > 0) {
            const sumRating = ratings.reduce((total, rating) => total + rating.rating, 0);
            averageRating = sumRating / ratings.length;
            averageRating = parseFloat(averageRating.toFixed(2));
        }

        const bagdetails = {
            ...bags,
            distance: distance / 1000,
            averageRating: averageRating,
            otherbags:otherbags
        };

        res.status(200).json({
            success: true,
            message: "Bags listing successful",
            data: bagdetails
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

exports.restBag = async (req, res) => {
    try {

        const {rest_id} = req.body; 

        const existingRestaurant = await Bag.find({ rest_id , isDeleted: { $ne: true }}).populate("rest_id").lean();
    

        if (!existingRestaurant || existingRestaurant.length === 0) {
            return res.status(200).json({ success: false, message: 'No Bag found' });
        }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * pageSize;
    const total =  existingRestaurant.length; // Use the count from the findAndCountAll result
    const totalPages = Math.ceil(total / pageSize);
    const result = existingRestaurant.slice(skip, skip + pageSize);


    if (page > totalPages) {
      return res.status(404).json({
        success: false,
        message:'data not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: "user find all data successfully 🔥",
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
};

exports.bagrestsearch = async(req , res)=>{
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
                    const existingRestaurant = await Bag.find({ rest_id: id  ,isDeleted: { $ne: true }}).lean();

                    

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

// exports.createBag = async (req, res) => {
//     try {
//         // Extract bag data from request body
//         const bagData = req.body;

//         // Create a new bag record in the database
//         const bag = await Bag.create(bagData);

//         // Extract the collection time from the request body
//         const collectionTime = bagData.collection_time;

//         // Extract the start and end times from the collection time
//         const [startTime, endTime] = collectionTime.split(' - ');

//         // Calculate the duration in milliseconds between the start and end times
//         const duration = calculateDuration(startTime, endTime);

//         // Schedule bag deletion after the specified duration
//         setTimeout(async () => {
//             try {
//                 // Mark the bag as deleted
//                 bag.isDeleted = true;
//                 await bag.save();
//                 console.log(`Bag with ID ${bag._id} deleted after collection time.`);
//             } catch (error) {
//                 console.error(`Error deleting bag with ID ${bag._id}:`, error);
//             }
//         }, duration);

//         // Respond with success message and bag data
//         res.status(200).json({
//             success: true,
//             message: "Bag created successfully",
//             data: bag
//         });
//     } catch (err) {
//         // Handle errors
//         console.log(err);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// function calculateDuration(startTime, endTime) {
//     const startTimestamp = new Date(startTime).getTime();
//     const endTimestamp = new Date(endTime).getTime();
//     return endTimestamp - startTimestamp;
// }

// function calculateDuration(startTime, endTime) {


//     const [startHours, startMinutes] = startTime.split(':').map(Number);
//     const [endHours, endMinutes] = endTime.split(':').map(Number);

//     const startMilliseconds = (startHours * 60 + startMinutes) * 60 * 1000;
//     const endMilliseconds = (endHours * 60 + endMinutes) * 60 * 1000;

//     return endMilliseconds - startMilliseconds;
// }