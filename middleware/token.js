const jwt = require('jsonwebtoken');
const User = require('../models/U_loginModel'); // Assuming your user model is named 'User'

const secretKey = process.env.SECRET_KEY;

const authenticateToken = async (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers["token"];

  console.log(token);

  if (!token) {
    return res.sendStatus(401); // Unauthorized if token is not provided
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // Attach user details to the request object

    // Check if the token is expired
    if (decoded.exp < Date.now() / 1000) {
      return res.status(403).json({ message: 'Token expired' });
    }

    // Check if the token belongs to an existing user
    const user = await User.findOne({ jwt_token: token });

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Token is valid and not expired, proceed to the next middleware
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = authenticateToken;
