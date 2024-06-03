const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');

const restaurantSchema = mongoose.Schema({
    rest_name: {
        type: String,
    },
    rest_bannerImg: {
        type: String
    },
    email: {
        type: String,
    },
    address: {
        type: String
    },
    password: {
        type: String,
    },
    otp: {
        type: String
    },
    contactNo: {
        type: String
    },
    location: {
        type: {
            type: String,
            enum: ['Point'], // You can specify 'Point' as the type for a GeoJSON Point
            required: true,
        },
        coordinates: {
            type: [Number], // [longitude, latitude] format
            required: true,
        },
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    warningCount: {
        type: Number,
        default: 0
    },
    verifiedYet: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{timestamps: true});

restaurantSchema.index({ location: '2dsphere' }); // Index for supporting GeoJSON queries


restaurantSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    // Generate and store JWT token
    // const token = jwt.sign({ userId: this._id }, process.env.SECRET_KEY);
    // this.jwt_token = token;

    next();
});

restaurantSchema.methods.comparePassword = async function (candidatePassword) {
    return await  bcrypt.compare(candidatePassword, this.password);
};


const R_registerSchema = mongoose.model('R_register', restaurantSchema);


module.exports = R_registerSchema;
