const U_login = require('../models/U_loginModel');
const twilio = require('twilio');
const crypto = require('crypto');
const { log } = require('console');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const testTwilioClient  = twilio(accountSid,authToken);


const generateRandomOTP = () => {
    const otp = crypto.randomInt(10000);
    return otp.toString()
  };
  
  exports.userRegister = async (req, res) => {``
    try {
        console.log("Request Body:", req.body);

        const { phonenumber } = req.body;

        if (!phonenumber || typeof phonenumber !== 'string') {
            return res.status(400).json({ error: 'Invalid phone number' });
        }

        const existingUser = await U_login.findOne({ phonenumber });

        console.log("existingUser", existingUser);

        if (existingUser) {
            return res.status(400).json({ error: 'User already registered' });
        }

        const newUser = new U_login({ phonenumber });

        const generatedOTP = generateRandomOTP();
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 2); // Set expiration time to 2 minutes from now

        newUser.otp = generatedOTP;
        newUser.otpExpiration = expirationTime;

        console.log("Generated OTP:", generatedOTP);
        console.log("OTP Expiration:", expirationTime);

        // try {
        //     const testMessage = await testTwilioClient.messages.create({
        //         body: `Test message from Twilio  ${generatedOTP}`,
        //         to: phonenumber,
        //         from: process.env.TWILIO_NUMBER
        //     });
        //     console.log('Test message sent successfully:', testMessage.sid);
        // } catch (testTwilioError) {
        //     console.error('Test Twilio error:', testTwilioError);
        // }

        //   newUser.location = {
        //     type: 'Point',
        //     coordinates: [location.coordinates[1], location.coordinates[0]] // Swap latitude and longitude
        // };

        await newUser.save();

        // Schedule deletion of OTP after 2 minutes
        setTimeout(async () => {
            await U_login.findOneAndDelete({ phonenumber, otp: generatedOTP });
            console.log('OTP deleted after 2 minutes');
        }, 2 * 60 * 1000);

        res.json({ message: 'OTP sent successfully. Please verify OTP to complete registration.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
exports.verifyOTPAndRegister = async (req, res) => {
    try {
        const { phonenumber, enteredOTP } = req.body;

        console.log("body", req.body);

        const user = await U_login.findOne({ phonenumber });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        if (user.otp !== enteredOTP || new Date() > user.otpExpiration) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        if (!user.isRegistered) {
            // If the user is not registered, mark them as registered
            user.isRegistered = true;
            await user.save();
        }

        res.json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.forgetPassword = async (req, res) => {
    try {
        const { phonenumber } = req.body;

        if (!phonenumber || typeof phonenumber !== 'string') {
            return res.status(400).json({ error: 'Invalid phone number' });
        }

        const user = await U_login.findOne({ phonenumber });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const generatedOTP = generateRandomOTP();
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 2); 

        user.resetPasswordOTP = generatedOTP;
        user.resetPasswordExpiration = expirationTime;

        console.log("Generated OTP for Forget Password:", generatedOTP);
        console.log("OTP Expiration:", expirationTime);

        try {
            const testMessage = await testTwilioClient.messages.create({
                body: `Your OTP for password reset is ${generatedOTP}`,
                to: phonenumber,
                from: process.env.TWILIO_NUMBER
            });
            console.log('Forget Password OTP sent successfully:', testMessage.sid);
        } catch (testTwilioError) {
            console.error('Forget Password OTP Twilio error:', testTwilioError);
        }

        await user.save(); 

        setTimeout(async () => {
            await U_login.findOneAndUpdate({ phonenumber }, { $unset: { resetPasswordOTP: 1, resetPasswordExpiration: 1 } });
            console.log('Forget Password OTP deleted after 2 minutes');
        }, 2 * 60 * 1000);

        res.json({ message: 'Forget Password OTP sent successfully. Use this OTP to reset your password.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}



exports.resetPassword = async (req, res) => {
    try {
        const { phonenumber, newPassword, resetPasswordOTP } = req.body;

        const user = await U_login.findOne({ phonenumber });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        if (user.resetPasswordOTP !== resetPasswordOTP || new Date() > user.resetPasswordExpiration) {
            return res.status(400).json({ error: 'Invalid or expired OTP for password reset' });
        }

        // Reset password and clear reset password related fields
        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpiration = undefined;

        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


exports.updateLocation = async (req, res) => {
    try{
        const userId = req.query.id;
        const { Latitude, Longitude } = req.body;

        const location = await U_login.findByIdAndUpdate(userId,{
            location: {
                type: 'Point',
                coordinates: [parseFloat(Longitude), parseFloat(Latitude)],
            },  
        });
        console.log(location,"location");

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            data: location
        })
    }catch(err){
        res.status(500).json({
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const userId = req.query.id;
        const otherDetails = req.body;
        const modified_date = new Date();

        console.log(req.body);

        const existingUser = await U_login.findById(userId);

        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check if email already exists
        const emailExists = await U_login.findOne({ email: otherDetails.email, _id: { $ne: userId } });
        if (emailExists) {
            return res.status(400).json({ status: false, message: 'Email already exists. Choose a different email.' });
        }

        // Check if phone number already exists
        const phoneExists = await U_login.findOne({ phonenumber: otherDetails.phonenumber, _id: { $ne: userId } });
        if (phoneExists) {
            return res.status(400).json({ status: false, message: 'Phone number already exists. Choose a different phone number.' });
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
