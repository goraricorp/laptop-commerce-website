// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');

// // Cấu hình multer để lưu ảnh vào thư mục tạm
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const uploadPath = path.join(__dirname, '../../../client/public/assets/img/avatars');
//         if (!fs.existsSync(uploadPath)) {
//             fs.mkdirSync(uploadPath, { recursive: true });
//         }
//         cb(null, uploadPath); // Đường dẫn đến thư mục lưu ảnh
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + path.extname(file.originalname)); // Đặt tên file duy nhất
//     }
// });

// const upload = multer({ storage: storage });

// module.exports = upload;

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (uploadPath) => multer.diskStorage({
    destination: (req, file, cb) => {
        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const getMulterMiddleware = (uploadPath) => multer({ storage: createStorage(uploadPath) });
module.exports = getMulterMiddleware;