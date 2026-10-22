const Product = require('../models/Product');
const Description = require('../models/Description');
const Configuration = require('../models/Configuration')
const Accessory = require("../models/Accessory")
const Rating = require("../models/Rating")
const Color = require("../models/Color")
const Category = require("../models/Category")
const Account = require("../models/Account")
const User = require("../models/User")
const BillDetail = require("../models/BillDetail")
const CartItem = require("../models/CartItem")
const Cart = require("../models/Cart");
const Brand = require("../models/Brand");
const { Op, where, Sequelize } = require("sequelize");
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

class ProductController {
    async loadProduct(req, res) {
        try {
            const products = await Product.findAll({ where: { status: 1 } });
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching products', error });
        }
    }

    async loadProperties(req, res) {
        try {
            // Fetch product by its primary key (using req.params.idproduct) and include related models

            const product = await Product.findByPk(req.params.idproduct, {
                attributes: ['idproduct', 'product_name', 'brand', 'product_image', 'status', 'type'],
                include: [
                    {
                        model: Configuration, // Including the Configuration model
                        attributes: ['idconfiguration', 'cpu', 'ram', 'gpu', 'storage', 'screen', 'resolution', 'price', 'quantity'],
                    },
                    {
                        model: Color, // Including the Color model (if applicable)
                        attributes: ['idcolor', 'color'],
                    },
                    {
                        model: Description, // Including the Description model (assuming you have one)
                        attributes: ['iddescription', 'title_description', 'sub_description'],
                    },
                    {
                        model: Accessory, // Including Accessory model (if applicable)
                        attributes: ['idaccessory', 'nums_key', 'switch_type', 'connection', 'price'],
                    },
                    // {
                    //     model: Rating, // Including Rating model (if applicable)
                    //     attributes: ['idaccessory', 'nums_key', 'switch_type', 'connection', 'price'],
                    // }
                ],
            });

            // console.log(product)

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Format the result as required
            const result = {
                idproduct: product.idproduct,
                name: product.product_name,
                brand: product.brand,
                image: product.product_image,
                status: product.status,
                type: product.type,
                configurations: product.Configurations.map(config => ({
                    idconfiguration: config.idconfiguration,
                    cpu: config.cpu,
                    ram: config.ram,
                    gpu: config.gpu,
                    storage: config.storage,
                    screen: config.screen,
                    resolution: config.resolution,
                    price: config.price,
                    quantity: config.quantity,
                })),
                colors: product.Colors.map(color => ({
                    idcolor: color.idcolor,
                    color: color.color,
                })),
                descriptions: product.Descriptions.map(desc => ({
                    iddescription: desc.iddescription,
                    title_description: desc.title_description,
                    sub_description: desc.sub_description,
                })),
                accessories: product.Accessories.map(accessory => ({
                    idaccessory: accessory.idaccessory,
                    nums_key: accessory.nums_key,
                    switch_type: accessory.switch_type,
                    connection: accessory.connection,
                    price: accessory.price,
                }))
            };

            // console.log(result);
            return res.json(result);
        } catch (error) {
            // console.error('Error fetching product properties:', error);
            return res.status(500).json({ error: 'Failed to load product properties' });
        }
    }

    async loadSpotlight(req, res) {
        try {
            let productsByBrand = await Product.findAll({
                where: { status: 1 },
                order: Sequelize.literal('RAND()'),  // Lấy ngẫu nhiên sử dụng literal nếu random() gặp lỗi
                limit: 8
            });

            if (productsByBrand.length < 4) {
                const remainingProducts = 4 - productsByBrand.length;

                const additionalProducts = await Product.findAll({
                    order: Sequelize.literal('RAND()'),  // Lấy ngẫu nhiên
                    limit: remainingProducts
                });

                productsByBrand = [...productsByBrand, ...additionalProducts];
            }

            res.status(200).json(productsByBrand);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching spotlight products', error });
        }
    }

    async loadTopSpotlight(req, res) {
        try {
            const productsFromBillDetails = await BillDetail.findAll({
                attributes: [
                    'idproduct', // Lọc theo sản phẩm
                    [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'] // Tổng số lượng sản phẩm đã mua
                ],
                group: ['idproduct'], // Group theo id sản phẩm
                order: [[Sequelize.col('totalQuantity'), 'DESC']], // Sắp xếp theo số lượng giảm dần
                limit: 8  // Lấy 8 sản phẩm bán chạy nhất từ BillDetail
            });

            const productsFromCartItems = await CartItem.findAll({
                attributes: [
                    'idproduct',
                    [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity']
                ],
                group: ['idproduct'],
                order: [[Sequelize.col('totalQuantity'), 'DESC']]
            });

            let allProducts = [];

            productsFromBillDetails.forEach(product => {
                allProducts.push({
                    idproduct: product.idproduct,
                    totalQuantity: parseInt(product.dataValues.totalQuantity),
                    source: 'BillDetail'
                });
            });

            productsFromCartItems.forEach(product => {
                let existingProduct = allProducts.find(p => p.idproduct === product.idproduct);
                if (existingProduct) {
                    existingProduct.totalQuantity += parseInt(product.dataValues.totalQuantity);
                } else {
                    allProducts.push({
                        idproduct: product.idproduct,
                        totalQuantity: parseInt(product.dataValues.totalQuantity),
                        source: 'CartItem'
                    });
                }
            });

            allProducts.sort((a, b) => b.totalQuantity - a.totalQuantity);

            const topSellingProducts = await Product.findAll({
                where: {
                    idproduct: {
                        [Op.in]: allProducts.slice(0, 8).map(product => product.idproduct) // Lấy 8 sản phẩm bán chạy nhất
                    },
                    status: 1
                }
            });

            res.status(200).json(topSellingProducts);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching top selling products', error });
        }
    }

    async loadSimilarity(req, res) {
        const { idproduct } = req.params;
        try {
            const product = await Product.findByPk(idproduct);

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            const productsByBrand = await Product.findAll({
                where: {
                    brand: product.brand,
                    idproduct: { [Op.ne]: idproduct }
                },
                limit: 4
            });
            // console.log(productsByBrand)

            if (productsByBrand.length < 4) {
                const remainingProducts = 4 - productsByBrand.length;

                const productsByCategory = await Product.findAll({
                    where: {
                        idcategory: product.idcategory,
                        idproduct: { [Op.ne]: idproduct }
                    },
                    limit: remainingProducts
                });

                productsByBrand.push(...productsByCategory);

                if (productsByBrand.length < 4) {
                    const additionalProducts = await Product.findAll({
                        where: {
                            idproduct: { [Op.ne]: idproduct }
                        },
                        limit: 4 - productsByBrand.length
                    });

                    productsByBrand.push(...additionalProducts);
                }
            }

            res.status(200).json(productsByBrand);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching similar products', error });
        }
    }

    async loadBrands(req, res) {
        try {
            // const brands = await Product.findAll({ attributes: ['brand'], group: ['brand'] });
            const brands = await Brand.findAll();
            res.json(brands);
        } catch (error) {

        }
    }

    async loadAllProduct(req, res) {
        try {
            const products = await Product.findAll();
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching products', error });
        }
    }

    async updateStatus(req, res) {
        const { idproduct } = req.params;
        const updatedData = req.body; // Giả sử dữ liệu cập nhật được gửi từ client trong body

        try {
            const product = await Product.findOne({
                where: { idproduct: idproduct },
            });

            if (!product) {
                return res.status(404).json({ message: `No account found with id ${idproduct}` });
            }

            await product.update({
                status: updatedData.status
            });

            res.status(200).json({ success: true, message: 'User updated successfully', data: updatedData });

        } catch (error) {
            // console.error('Error updating product name:', error);
            res.status(500).json({ success: false, message: 'Error updating product name', error });
        }
    }

    async loadRating(req, res) {
        const { idproduct } = req.params;
        try {
            const ratings = await Rating.findAll({
                where: { idproduct },
                attributes: ['idrating', 'score', 'comment', 'rating_date'],
                include: [
                    {
                        model: Account,
                        attributes: ['idaccount', 'username', 'email'],
                        include: [
                            {
                                model: User,
                                attributes: ['iduser', 'firstname', 'lastname', 'avatar']
                            }
                        ]
                    }
                ]
            });

            if (ratings.length === 0) {
                return res.status(200).json([]);
            }

            // Nếu có đánh giá, định dạng lại kết quả
            const results = ratings.map(rating => ({
                idrating: rating.idrating,
                score: rating.score,
                comment: rating.comment,
                rating_date: rating.rating_date,
                reviewer: rating.Account && rating.Account.User ? {
                    username: rating.Account.username,
                    email: rating.Account.email,
                    firstname: rating.Account.User.firstname,
                    lastname: rating.Account.User.lastname,
                    avatar: rating.Account.User.avatar,
                } : null
            }));

            results.sort((a, b) => new Date(b.rating_date) - new Date(a.rating_date));

            return res.status(200).json(results);
        } catch (error) {
            // console.error("Error fetching ratings:", error);
            return res.status(500).json({ message: "Error fetching ratings", error });
        }
    }

    async loadRatingOld(req, res) {
        const { idproduct } = req.params; // Retrieve idProduct from request parametersid
        try {
            // Find ratings with associated Account and User
            const ratings = await Rating.findAll({
                where: { idproduct: idproduct },
                attributes: ['idrating', 'score', 'comment', 'rating_date'],
                include: [{
                    model: Account,
                    attributes: ['idaccount', 'username', 'email'],
                    include: [{
                        model: User,
                        attributes: ['iduser', 'firstname', 'lastname', 'avatar'] // Specify the fields you need from the User
                    }]
                }]
            });

            console.log(ratings, idproduct);

            // If ratings are found, return them in the desired format
            if (ratings.length > 0) {
                const results = ratings.map(rating => ({
                    idrating: rating.idrating,
                    score: rating.score,
                    comment: rating.comment,
                    rating_date: rating.rating_date,
                    reviewer: rating.Account ? {
                        // idaccount: rating.Account.idaccount,
                        username: rating.Account.username,
                        email: rating.Account.email,
                        firstname: rating.Account.User.firstname,
                        lastname: rating.Account.User.lastname,
                        avatar: rating.Account.User.avatar,
                        // user: rating.Account.User ? {
                        //     iduser: rating.Account.User.iduser,
                        // } : null
                    } : null
                }))

                results.sort((up, down) => new Date(down.rating_date) - new Date(up.rating_date));

                // console.log(results, idproduct)
                res.status(200).json(results);
            } else {
                // console.log(idproduct)
                res.status(404).json({ message: `No ratings found for product with id ${idProduct}` });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error fetching ratings', error });
        }
    }

    async loadRatingMiddleware(req, res) {
        // console.log(req.body, req.user);
        try {
            const rating = await Rating.findOne({
                where: {
                    idaccount: req.user.id,
                    idproduct: req.body.idproduct
                }
            });

            // console.log(rating);
            res.json(rating);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching ratings', error });
        }
    }

    async createRatingMiddleware(req, res) {
        try {
            const { idproduct, score, comment } = req.body;

            // Kiểm tra xem đã có đánh giá cho sản phẩm này chưa
            const existingRating = await Rating.findOne({
                where: {
                    idaccount: req.user.id,
                    idproduct: idproduct
                }
            });

            if (existingRating) {
                return res.status(400).json({ message: 'You have already rated this product' });
            }

            // Tạo mới đánh giá
            const newRating = await Rating.create({
                idaccount: req.user.id,
                idproduct: idproduct,
                score: score,
                comment: comment,
                rating_date: new Date()
            });

            res.status(201).json({
                message: 'Rating created successfully',
                data: newRating
            });
        } catch (error) {
            // console.error(error);
            res.status(500).json({ message: 'Error creating rating', error });
        }
    }

    async changeRatingMiddleware(req, res) {
        try {
            const { score, comment } = req.body;
            const ratingId = req.params.id;

            // Tìm đánh giá hiện tại
            // const rating = await Rating.findOne({
            //     where: {
            //         idaccount: req.user.id,
            //         idrating: ratingId
            //     }
            // });

            const rating = await Rating.findByPk(ratingId);

            if (!rating) {
                return res.status(404).json({ message: 'Rating not found' });
            }

            // Cập nhật đánh giá
            rating.score = score || rating.score;
            rating.comment = comment || rating.comment;

            await rating.save();

            res.status(200).json({
                message: 'Rating updated successfully',
                data: rating
            });
        } catch (error) {
            // console.error(error);
            res.status(500).json({ message: 'Error updating rating', error });
        }
    }

    async removeRatingMiddleware(req, res) {
        try {
            const ratingId = req.params.id;

            const rating = await Rating.findOne({
                where: {
                    idaccount: req.user.id,
                    idrating: ratingId
                }
            });

            if (!rating) {
                return res.status(404).json({ message: 'Rating not found' });
            }

            // Xóa đánh giá
            await rating.destroy();

            res.status(200).json({
                message: 'Rating removed successfully'
            });
        } catch (error) {
            // console.error(error);
            res.status(500).json({ message: 'Error removing rating', error });
        }
    }

    /////////////////////////////////////////////////////////////////////////////

    async searchProduct(req, res) {
        const { search } = req.params; // Lấy từ khóa tìm kiếm từ request parameters

        try {
            // Tìm tất cả sản phẩm, bao gồm các bảng liên quan
            const products = await Product.findAll({
                include: [
                    {
                        model: Configuration,
                        as: 'Configurations',
                        required: false, // Nếu không có cấu hình thì vẫn trả về sản phẩm
                    },
                    {
                        model: Color,
                        as: 'Colors',
                        required: false,
                    }
                ],
                where: {
                    [Op.or]: [
                        { product_name: { [Op.like]: `%${search}%` } },
                        { brand: { [Op.like]: `%${search}%` } },
                        { "$Configurations.cpu$": { [Op.like]: `%${search}%` } },
                        { "$Configurations.ram$": { [Op.like]: `%${search}%` } },
                        { "$Configurations.gpu$": { [Op.like]: `%${search}%` } },
                        { "$Configurations.storage$": { [Op.like]: `%${search}%` } },
                        { "$Configurations.screen$": { [Op.like]: `%${search}%` } },
                        { "$Configurations.resolution$": { [Op.like]: `%${search}%` } },
                        { "$Configurations.price$": { [Op.like]: `%${search}%` } },
                        { "$Colors.color$": { [Op.like]: `%${search}%` } },
                        // Nếu có thêm các trường cần tìm, bạn có thể thêm vào đây
                    ]
                }
            });

            if (products.length > 0) {
                return res.status(200).json(products);
            } else {
                return res.status(404).json({
                    message: `No products found matching the search query '${search}'`
                });
            }
        } catch (error) {
            // console.error("Error fetching products:", error);
            return res.status(500).json({ message: 'Error fetching products', error });
        }
    }

    async loadProductWithCondition(req, res) {
        const { filters } = req.query;

        if (!filters) {
            return res.status(400).json({ message: "No filters provided." });
        }

        // Parse query string filters thành object:
        // { CPU: ['Intel core i5', 'AMD Ryzen 7'], GPU: ['RTX 3050', 'RTX 3060'] }
        const filterObj = {};
        filters.split(';').forEach(segment => {
            const [category, values] = segment.split(':');
            if (category && values) {
                filterObj[category.trim()] = values.split(',').map(val => val.trim());
            }
        });

        // Map category name với trường trong bảng Configuration hoặc Color
        // Ví dụ: CPU, GPU, RAM, Storage, Screen đều nằm trong bảng Configuration
        const fieldMap = {
            CPU: "$Configurations.cpu$",
            GPU: "$Configurations.gpu$",
            RAM: "$Configurations.ram$",
            Storage: "$Configurations.storage$",
            Screen: "$Configurations.screen$",
            // Nếu cần thêm filter từ bảng Color, ví dụ:
            // Color: "$Colors.color$"
        };

        // Xây dựng mảng điều kiện (conditions)
        const conditions = [];
        Object.keys(filterObj).forEach(category => {
            const field = fieldMap[category];
            if (field) {
                conditions.push({
                    [field]: {
                        [Op.in]: filterObj[category]
                    }
                });
            }
        });

        // Nếu có nhiều điều kiện, kết hợp bằng AND
        const whereCondition = conditions.length > 0 ? { [Op.and]: conditions } : {};

        try {
            // Tìm sản phẩm với các điều kiện tìm kiếm ở bảng Product và các bảng liên quan
            const products = await Product.findAll({
                include: [
                    {
                        model: Configuration,
                        as: "Configurations",
                        required: true, // Nếu không có cấu hình thì không trả về sản phẩm
                    },
                    {
                        model: Color,
                        as: "Colors",
                        required: false, // Nếu bạn có filter theo màu, có thể set required tùy ý
                    }
                ],
                where: whereCondition
            });

            if (products.length > 0) {
                return res.status(200).json(products);
            } else {
                return res.status(404).json({ message: "No products found matching the applied filters." });
            }
        } catch (error) {
            // console.error("Error filtering products:", error);
            return res.status(500).json({ message: "Error filtering products", error });
        }
    }

    /////////////////////////////////////////////////////////////////////////////

    async loadProductWithID(req, res) {
        const { idProduct } = req.params; // Retrieve idProduct from request parameters
        try {
            const products = await Product.findAll({
                where: {
                    idProduct: idProduct
                }
            });

            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching products', error });
        }
    }

    async loadDescription(req, res) {
        const { idProduct } = req.params; // Retrieve idProduct from request parameters
        // console.log(req.params)
        try {
            // Find descriptions where idProduct matches the provided id
            const description = await Description.findAll({
                where: {
                    idProduct: idProduct
                }
            });

            // If descriptions are found, return them, otherwise return a 404
            if (description.length > 0) {
                res.status(200).json(description);
            } else {
                res.status(404).json({ message: `No descriptions found for product with id ${idProduct}` });
            }

        } catch (error) {
            res.status(500).json({ message: 'Error fetching descriptions', error });
        }
    }

    async loadConfiguration(req, res) {
        const { idProduct } = req.params; // Retrieve idProduct from request parameters

        try {
            // Find descriptions where idProduct matches the provided id
            const configuration = await Configuration.findAll({
                where: {
                    idProduct: idProduct
                }
            });

            // If configurations are found, return them, otherwise return a 404
            if (configuration.length > 0) {
                res.status(200).json(configuration);
            } else {
                res.status(404).json({ message: `No configurations found for product with id ${idProduct}` });
            }

        } catch (error) {
            res.status(500).json({ message: 'Error fetching configurations', error });
        }
    }

    async loadConfigurationByID(req, res) {
        const { idConfiguration } = req.params; // Retrieve idProduct from request parameters

        try {
            // Find descriptions where idProduct matches the provided id
            const configuration = await Configuration.findAll({
                where: {
                    idconfiguration: idConfiguration
                }
            });

            // If configurations are found, return them, otherwise return a 404
            if (configuration.length > 0) {
                res.status(200).json(configuration);
            }

        } catch (error) {
            res.status(500).json({ message: 'Error fetching configurations', error });
        }
    }

    async loadColor(req, res) {
        const { idProduct } = req.params; // Retrieve idProduct from request parameters

        try {
            // Find descriptions where idProduct matches the provided id
            const colors = await Color.findAll({
                where: {
                    idProduct: idProduct
                }
            });

            // If ratings are found, return them, otherwise return a 404
            if (colors.length > 0) {
                res.status(200).json(colors);
            } else {
                res.status(404).json({ message: `No ratings found for product with id ${idProduct}` });
            }

        } catch (error) {
            res.status(500).json({ message: 'Error fetching ratings', error });
        }
    }

    async loadProductWithBrand(req, res) {
        const { Brand } = req.params; // Retrieve idProduct from request parameters

        try {
            // Find descriptions where idProduct matches the provided id
            const product = await Product.findAll({
                where: {
                    brand: Brand,
                    status: 1
                }
            });

            // If ratings are found, return them, otherwise return a 404
            if (product.length > 0) {
                res.status(200).json(product);
            } else {
                res.status(404).json({ message: `No ratings found for product with id ` });
            }

        } catch (error) {
            res.status(500).json({ message: 'Error fetching ratings', error });
        }
    }

    async loadProductWithName(req, res) {
        const { name } = req.params; // Retrieve idProduct from request parameters

        try {
            // Find descriptions where idProduct matches the provided id
            const product = await Product.findAll({
                where: {
                    product_name: {
                        [Op.like]: `%${name}%`
                    }
                }
            });

            // If ratings are found, return them, otherwise return a 404
            if (product.length > 0) {
                res.status(200).json(product);
            } else {
                res.status(404).json({ message: `No ratings found for product with id ` });
            }

        } catch (error) {
            res.status(500).json({ message: 'Error fetching ratings', error });
        }
    }

    async loadProductWithConditionOld(req, res) {
        const { CPU } = req.params;

        try {
            // Columns to check in the Configuration table
            const columnsToCheck = ['cpu', 'ram', 'gpu', 'storage', 'screen'];
            let matchingColumn = null;
            let product = null;

            // Loop through columns and find the first match for CPU value
            for (const column of columnsToCheck) {
                product = await Configuration.findAll({
                    where: { [column]: CPU }
                });

                if (product.length > 0) {
                    matchingColumn = column;
                    break; // Stop once a match is found
                }
            }

            // If a match was found, return the results
            if (matchingColumn) {
                res.status(200).json(product);
            } else {
                // If no matching column was found, return a 404
                res.status(404).json({ message: `No products found matching the value '${CPU}'` });
            }

        } catch (error) {
            res.status(500).json({ message: 'Error fetching products', error });
        }
    }

    async updateProductName(req, res) {
        const { idProduct } = req.params;
        const updatedData = req.body;
        const idcategory = parseInt(updatedData.idcategory, 10);
        try {
            const product = await Product.findOne({
                where: { idProduct: idProduct },
            });
            const category = await Category.findOne({
                where: { idcategory: idcategory },
            });
            function convertBackslashesToSlashes(path) {
                return path.replace(/\\/g, '/');
            }
            let filepath = product.product_image; // Giữ nguyên ảnh cũ nếu không có ảnh mới
            // console.log(req.file);
            if (req.file) {
                const avatarPath = path.join(__dirname, '../../../client/public/assets/img/product');
                if (!fs.existsSync(avatarPath)) {
                    fs.mkdirSync(avatarPath, { recursive: true });
                }
                const filePath = `/assets/img/product/${req.file.filename}`;
                filepath = convertBackslashesToSlashes(filePath);
            }
            if (!product) {
                return res.status(404).json({ message: `No account found with id ${idProduct}` });
            }

            await category.update({
                where: {
                    idcategory: idcategory
                },
            });

            await product.update({
                idcategory: updatedData.idcategory,
                product_name: updatedData.product_name,
                brand: updatedData.brand,
                product_image: filepath
            });

            // await t.commit(); // Cam kết transaction
            res.status(200).json({ success: true, message: 'User updated successfully', data: updatedData });

        } catch (error) {
            console.log(error);
            // console.error('Error updating product name:', error);
            res.status(500).json({ success: false, message: 'Error updating product name', error });
        }
    }

    async deleteProductName(req, res) {
        try {
            const { idProduct } = req.params
            const product = await Product.findOne({
                where: {
                    idProduct: idProduct
                }
            });

            await product.destroy();
            res.status(200).json({ success: true, message: 'Product name deleted successfully' });
        } catch (error) {
            // console.error('Error deleting product name:', error);
            res.status(500).json({ success: false, message: 'Error deleting product name', error });
        }
    }

    async createProductName(req, res) {
        const Data = req.body; // Giả sử dữ liệu cập nhật được gửi từ client trong body
        try {
            function convertBackslashesToSlashes(path) {
                return path.replace(/\\/g, '/');
            }
            // console.log(req.file);
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            // console.log(req.file);
            const avatarPath = path.join(__dirname, '../../../client/public/assets/img/product');
            if (!fs.existsSync(avatarPath)) {
                fs.mkdirSync(avatarPath, { recursive: true });
            }
            const filePath = `/assets/img/product/${req.file.filename}`
            const filepath = convertBackslashesToSlashes(filePath);
            const newProduct = await Product.create({
                product_name: Data.product_name,
                brand: Data.brand,
                idcategory: Data.idcategory,
                product_image: filepath
            });
            // console.log(filePath)
            // console.log('Product created successfully:', newProduct);
            return res.status(201).json({
                product: newProduct,
            });
        } catch (error) {
            console.log(error)
            res.status(500).json({ success: false, message: 'Error create user', error });
        }
    }

    async createDescription(req, res) {
        const Data = req.body; // Giả sử dữ liệu cập nhật được gửi từ client trong body
        try {

            const newDescription = await Description.create({
                idProduct: Data.idProduct,
                description: Data.description,
            });

            // console.log('Description created successfully:', newDescription);
            return res.status(201).json({
                description: newDescription,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error create user', error });
        }
    }

    async UploadProductImage(req, res) {
        try {
            function convertBackslashesToSlashes(path) {
                return path.replace(/\\/g, '/');
            }
            // console.log(req.file);
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            // console.log(req.file);
            const avatarPath = path.join(__dirname, '../../../client/public/assets/img/product');
            if (!fs.existsSync(avatarPath)) {
                fs.mkdirSync(avatarPath, { recursive: true });
            }
            const filePath = `/assets/img/product/${req.file.filename}`;
            const product = await Product.findOne({ where: { product_name: req.body.product_name } });
            // console.log(req.body)
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            const filepath = convertBackslashesToSlashes(filePath);
            console.log(filepath)
            await product.update({ product_image: filepath });

            res.status(200).json({ message: 'Image uploaded successfully', avatarPath: filePath });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Failed to upload Image', error: error.message });
        }
    }
}

module.exports = new ProductController();
