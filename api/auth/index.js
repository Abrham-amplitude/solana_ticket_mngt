var jwt = require("jsonwebtoken");
var model = require("../model");
const crypto = require("crypto");
const SECRET = process.env.SECRET;

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials",
      });
    }

    const user = await model.User.findOne({
      username: username,
      password: encryptPassword(password),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. User not found.",
      });
    }

    if (user.password !== encryptPassword(password)) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Wrong password.",
      });
    }

    const expires = expiresIn(7);
    const token = jwt.sign(
      { username: user.username, password: user.password },
      SECRET,
      { expiresIn: expires }
    );

    res.json({
      success: true,
      token: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const signup = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(401).json({
        status: 401,
        message: "Required fields missing",
      });
    }

    const user = new model.User({
      username,
      password: encryptPassword(password),
      email,
    });

    const savedUser = await user.save();
    res.json(savedUser);
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

const logout = (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

const verify = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: "No Token provided.",
    });
  }

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Failed to authenticate token.",
      });
    }
    req.decoded = decoded;
    next();
  });
};

function encryptPassword(password) {
  return crypto.createHmac("sha1", SECRET).update(password).digest("hex");
}

function expiresIn(numDays) {
  const dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}

module.exports = {
  login,
  signup,
  logout,
  verify,
};
