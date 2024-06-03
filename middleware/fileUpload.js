const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    let ext = file.originalname;
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
});

module.exports = upload;
