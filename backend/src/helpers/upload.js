const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '..', '..', 'uploads');

    if (file.fieldname === 'image' || file.fieldname === 'images') {
      uploadPath = path.join(uploadPath, 'images');
    } else if (file.fieldname === 'certificate' || file.fieldname === 'certificates') {
      uploadPath = path.join(uploadPath, 'certificates');
    } else if (file.fieldname === 'resume') {
      uploadPath = path.join(uploadPath, 'resumes');
    } else if (file.fieldname === 'banner') {
      uploadPath = path.join(uploadPath, 'banners');
    } else if (file.fieldname === 'project') {
      uploadPath = path.join(uploadPath, 'projects');
    } else if (file.fieldname === 'profile') {
      uploadPath = path.join(uploadPath, 'images');
    } else if (file.fieldname === 'thumbnail') {
      uploadPath = path.join(uploadPath, 'thumbnails');
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  const allowedDocs = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedAll = [...allowedImages, ...allowedDocs];

  if (allowedAll.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }
});

module.exports = { upload };
