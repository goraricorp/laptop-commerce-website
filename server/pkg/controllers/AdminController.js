const express = require('express');
const app = express();
const db = require('../config/database.js')
const Account = require('../models/Account.js');
const User = require('../models/User.js');
const { where } = require('sequelize');
const Category = require("../models/Category.js");
const Product = require('../models/Product.js');
const Configuration = require('../models/Configuration.js')
const Color = require('../models/Color.js')
const Description = require('../models/Description.js')
const Discount = require('../models/Discount.js')
const Brand = require('../models/Brand.js')
class AdminController {

    async getAccount(req, res) {
        try {

            const account = await Account.findAll();
            res.status(200).json(account);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching account', error });
        }

    }
    async getUser(req, res) {
        try {

            const user = await User.findAll();
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching account', error });
        }

    }
    async getAccountId(req, res) {
        try {
            const { idaccount } = req.params
            const account = await Account.findAll({
                where: {
                    idaccount: idaccount
                }
            });
            res.status(200).json(account);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching account', error });
        }

    }
    async getUserId(req, res) {
        try {
            const { idaccount } = req.params
            const user = await User.findAll({
                where: {
                    idaccount: idaccount
                }
            });
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching account', error });
        }

    }
    async deleteUser(req, res) {
        try {
            const { idaccount } = req.params
            const account = await Account.findAll({
                where: {
                    idaccount: idaccount
                }
            });
            const user = await User.findAll({
                where: {
                    idaccount: idaccount
                }
            });
            // Xóa người dùng
            await account.destroy();
            await user.destroy();

            res.status(200).json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ success: false, message: 'Error deleting user', error });
        }
    }
    async updateAccount(req, res) {
        try {
            const { idaccount } = req.params
            const account = await Account.findAll({
                where: {
                    idaccount: idaccount
                }
            });
            if (account.length > 0) {
                await account.update(updatedData);
                res.status(200).json({ success: true, message: 'User updated successfully', data: updatedData });
            }
            else {
                res.status(404).json({ message: `No user found with id ${idaccount}` });
            }
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: 'Error updating user' });
        }
    }
    async updateUser(req, res) {
        try {
            const { idaccount } = req.params
            const user = await User.findAll({
                where: {
                    idaccount: idaccount
                }
            });
            if (user.length > 0) {
                await user.update(updatedData);
                res.status(200).json({ success: true, message: 'User updated successfully', data: updatedData });
            }
            else {
                res.status(404).json({ message: `No user found with id ${idaccount}` });
            }
            res.status(200).json({ success: true, message: 'User updated successfully', data: updatedData });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: 'Error updating user' });
        }
    }
    async getCategory(req, res) {
        try {

            const category = await Category.findAll();
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching category', error });
        }

    }
    async deleteCategory(req, res) {
        try {
            const { idCategory } = req.params

            const category = await Category.findOne({
                where: {
                    idCategory: idCategory
                }
            });
            // Xóa người dùng
            await category.destroy();
            res.status(200).json({ success: true, message: 'Category deleted successfully' });
        } catch (error) {
            console.error('Error deleting Category:', error);
            res.status(500).json({ success: false, message: 'Error deleting Category', error });
        }
    }
    async updateCategory(req, res) {
        const { idCategory } = req.params;


        if (!idCategory) {
            return res.status(400).json({ message: 'Category ID is required' });
        }

        const updatedData = req.body; // Dữ liệu cập nhật


        if (!updatedData || Object.keys(updatedData).length === 0) {
            return res.status(400).json({ message: 'No update data provided' });
        }

        try {
            const category = await Category.findOne({
                where: { idcategory: idCategory },
            });

            if (!category) {
                return res.status(404).json({ message: `No category found with id ${idCategory}` });
            }

            await category.update(updatedData); // Cập nhật dữ liệu từ client

            res.status(200).json({ success: true, message: 'Category updated successfully', data: category });

        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ success: false, message: 'Error updating category', error });
        }
    }
    async createCategory(req, res) {
        const Data = req.body; // Giả sử dữ liệu cập nhật được gửi từ client trong body

        try {

            const newCategory = await Category.create({
                category_name: Data.category_name,
            });

            console.log('Product created successfully:', newCategory);
            return res.status(201).json({
                category: newCategory,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error create user', error });
        }
    }

    async updateUserData(req, res) {
        const { idaccount } = req.params;
        const updatedData = req.body; // Giả sử dữ liệu cập nhật được gửi từ client trong body


        try {
            // Cập nhật bảng Account
            const account = await Account.findOne({
                where: { idaccount: idaccount },
                // transaction: t,
            });

            if (!account) {
                return res.status(404).json({ message: `No account found with id ${idaccount}` });
            }

            await account.update({ email: updatedData.email });

            // Cập nhật bảng User
            const user = await User.findOne({
                where: { idaccount: idaccount },
                // transaction: t,
            });

            if (!user) {
                return res.status(404).json({ message: `No user found with id ${idaccount}` });
            }

            await user.update({
                firstname: updatedData.firstname,
                lastname: updatedData.lastname,
                phone_number: updatedData.phone_number,
                username: updatedData.username
            });

            // await t.commit(); // Cam kết transaction
            res.status(200).json({ success: true, message: 'User updated successfully', data: updatedData });

        } catch (error) {
            await t.rollback(); // Hoàn tác nếu có lỗi
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: 'Error updating user', error });
        }
    }

    async createdejaptor(req, res) {
        const a = req.body
        try {
            const category = await Category.findOne({
                where: {
                    category_name: req.body.category_name
                }
            })
            if (!category) {
                return
            }
            // console.log(category.dataValues.idcategory)
            const product = await Product.create({
                product_name: a.product_name,
                brand: a.brand,
                product_image: a.product_image,
                idcategory: category.dataValues.idcategory
            })
            // console.log(a)
        } catch (error) {
            console.log(error)
        }
    }

    async getConfiguration(req, res) {
        try {
            const configuration = await Configuration.findAll();
            res.status(200).json(configuration);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching configuration', error });
        }

    }

    async updateConfiguration(req, res) {
        const { idConfiguration } = req.params;
        // console.log(idConfiguration);
        const updatedData = req.body;
        // console.log(updatedData)
        try {
            const product = await Product.findOne({
                where: { product_name: updatedData.product_name }
            })
            const configuration = await Configuration.findOne({
                where: { idconfiguration: idConfiguration },
            });

            if (!configuration) {
                return res.status(404).json({ message: `No configuration found with id ${idConfiguration}` });
            }
            const data = {
                cpu: updatedData.cpu,
                ram: updatedData.ram,
                gpu: updatedData.gpu,
                storage: updatedData.storage,
                screen: updatedData.screen,
                resolution: updatedData.resolution,
                price: updatedData.price,
                idproduct: product.idproduct
            }
            await configuration.update(data); // Cập nhật dữ liệu từ client

            res.status(200).json({ success: true, message: 'Configuration updated successfully', data: configuration });

        } catch (error) {
            console.error('Error updating configuration:', error);
            res.status(500).json({ success: false, message: 'Error updating configuration', error });
        }
    }

    async createConfiguration(req, res) {
        const Data = req.body; // Giả sử dữ liệu cập nhật được gửi từ client trong body
        try {
            const product = await Product.findOne({
                where: {
                    product_name: Data.product_name
                }
            })
            const newConfiguration = await Configuration.create({
                cpu: Data.cpu,
                ram: Data.ram,
                gpu: Data.gpu,
                storage: Data.storage,
                screen: Data.screen,
                resolution: Data.resolution,
                price: Data.price,
                idproduct: product.idproduct
            });
            console.log('newConfiguration created successfully:', newConfiguration);
            return res.status(201).json({
                configuration: newConfiguration,
            });
        } catch (error) {
            // console.log(error)
            res.status(500).json({ success: false, message: 'Error create configuration', error });
        }
    }

    async deleteConfiguration(req, res) {
        try {
            const { idConfiguration } = req.params
            console.log(idConfiguration)
            const configuration = await Configuration.findOne({
                where: {
                    idconfiguration: idConfiguration
                }
            });
            // Xóa người dùng
            await configuration.destroy();
            res.status(200).json({ success: true, message: 'Configuration deleted successfully' });
        } catch (error) {
            console.error('Error deleting Category:', error);
            res.status(500).json({ success: false, message: 'Error deleting Configuration', error });
        }
    }
    // async updateConfiguration(req, res) {
    //     const { idConfiguration } = req.params;
    //     console.log(idConfiguration);
    //     const updatedData = req.body;

    //     try {
    //         const configuration = await Configuration.findOne({
    //             where: { idconfiguration: idConfiguration },
    //         });

    //         if (!configuration) {
    //             return res.status(404).json({ message: `No configuration found with id ${idConfiguration}` });
    //         }

    //         await configuration.update(updatedData); // Cập nhật dữ liệu từ client

    //         res.status(200).json({ success: true, message: 'Configuration updated successfully', data: configuration });

    //     } catch (error) {
    //         console.error('Error updating configuration:', error);
    //         res.status(500).json({ success: false, message: 'Error updating configuration', error });
    //     }
    // }
    async getColor(req, res) {
        try {

            const color = await Color.findAll();
            res.status(200).json(color);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching color', error });
        }
    }
    async updateColor(req, res) {
        const { idColor } = req.params;
        const updatedData = req.body;
        try {
            const product = await Product.findOne({
                where: { product_name: updatedData.product_name }
            })
            const color = await Color.findOne({
                where: { idcolor: idColor },
            });
            if (!color) {
                return res.status(404).json({ message: `No color found with id ${idColor}` });
            }
            const data = {
                color: updatedData.color,
                idproduct: product.idproduct
            }
            await color.update(data); // Cập nhật dữ liệu từ client

            res.status(200).json({ success: true, message: 'Color updated successfully', data: color });

        } catch (error) {
            console.error('Error updating color:', error);
            res.status(500).json({ success: false, message: 'Error updating color', error });
        }
    }
    async createColor(req, res) {
        const Data = req.body; // Giả sử dữ liệu cập nhật được gửi từ client trong body
        try {
            const product = await Product.findOne({
                where: {
                    product_name: Data.product_name
                }
            })
            const newColor = await Color.create({
                color: Data.color,
                idproduct: product.idproduct
            });

            console.log('color created successfully:', newColor);
            return res.status(201).json({
                color: newColor,
            });
        } catch (error) {
            // console.log(error)
            res.status(500).json({ success: false, message: 'Error create color', error });
        }
    }
    async deleteColor(req, res) {
        try {
            const { idColor } = req.params
            // console.log(idColor)
            const color = await Color.findOne({
                where: {
                    idcolor: idColor
                }
            });
            // console.log(color)
            await color.destroy();
            res.status(200).json({ success: true, message: 'Color deleted successfully' });
        } catch (error) {
            console.error('Error deleting Category:', error);
            res.status(500).json({ success: false, message: 'Error deleting color', error });
        }
    }
    async payhd(req, res) {
        try {
            const color = await Color.findAll({
                attributes: ["color"],
                include: [{
                    model: Product,
                    attributes: ["product_name", "idproduct"],
                }]
            });
            console.log(color)
            res.status(200).json(color);
        } catch (error) {
            console.error('Error paying order:', error);
            res.status(500).json({ success: false, message: 'Error paying order', error });
        }
    }

    //----------------------------------------------------------------
    async getDescription(req, res) {
        try {

            const description = await Description.findAll();
            res.status(200).json(description);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching color', error });
        }

    }
    async updateDescription(req, res) {
        const { idDescription } = req.params;
        const updatedData = req.body;
        try {
            const description = await Description.findOne({
                where: { iddescription: idDescription },
            });
            const product = await Product.findOne({
                where: { product_name: updatedData.product_name }
            })
            if (!description) {
                return res.status(404).json({ message: `No description found with id ${description}` });
            }
            const data = {
                title_description: updatedData.title_description,
                idproduct: product.idproduct,
                sub_description: updatedData.sub_description,
                img_description: updatedData.img_description,
            }
            await description.update(data); // Cập nhật dữ liệu từ client

            res.status(200).json({ success: true, message: 'description updated successfully', data: description });

        } catch (error) {
            console.error('Error updating description:', error);
            res.status(500).json({ success: false, message: 'Error updating description', error });
        }
    }
    async createDescription(req, res) {
        const Data = req.body; // Giả sử dữ liệu cập nhật được gửi từ client trong body
        // console.log(Data)
        try {
            const product = await Product.findOne({
                where: {
                    product_name: Data.product_name
                }
            })
            // console.log(product)
            const newDescription = await Description.create({
                title_description: Data.title_description,
                idproduct: product.idproduct,
                sub_description: Data.sub_description,
                img_description: "Asus ROG Zephyrus image"
            });

            console.log('Description created successfully:', newDescription);
            return res.status(201).json({
                description: newDescription,
            });
        } catch (error) {
            // console.log(error)
            res.status(500).json({ success: false, message: 'Error create description', error });
        }
    }
    async deleteDescription(req, res) {
        try {
            const { idDescription } = req.params
            // console.log(idColor)
            const description = await Description.findOne({
                where: {
                    iddescription: idDescription
                }
            });
            // console.log(color)
            await description.destroy();
            res.status(200).json({ success: true, message: 'Description deleted successfully' });
        } catch (error) {
            console.error('Error deleting description:', error);
            res.status(500).json({ success: false, message: 'Error deleting description', error });
        }
    }
    async getVoucher(req, res) {
        try {
            const voucher = await Discount.findAll();
            // console.log(voucher)
            res.status(200).json(voucher);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching voucher', error });
        }

    }
    async getVoucherName(req, res) {
        try {
            const { VoucherName } = req.body
            const voucher = await Discount.findAll({
                where: {
                    discount_name: VoucherName
                }
            });
            res.status(200).json(voucher);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching voucher', error });
        }

    }
    async deleteVoucher(req, res) {
        try {
            const { idVoucher } = req.params

            const voucher = await Discount.findOne({
                where: {
                    iddiscount: idVoucher
                }
            });
            // Xóa người dùng
            await voucher.destroy();
            res.status(200).json({ success: true, message: 'Voucher deleted successfully' });
        } catch (error) {
            console.error('Error deleting voucher:', error);
            res.status(500).json({ success: false, message: 'Error deleting voucher', error });
        }
    }
    async updateVoucher(req, res) {
        const { idVoucher } = req.params;


        if (!idVoucher) {
            return res.status(400).json({ message: 'Voucher ID is required' });
        }

        const updatedData = req.body; // Dữ liệu cập nhật
        // console.log(updatedData);

        if (!updatedData || Object.keys(updatedData).length === 0) {
            return res.status(400).json({ message: 'No update data provided' });
        }

        try {
            const voucher = await Discount.findOne({
                where: { iddiscount: idVoucher },
            });

            if (!voucher) {
                return res.status(404).json({ message: `No voucher found with id ${idVoucher}` });
            }

            await voucher.update(updatedData); // Cập nhật dữ liệu từ client

            res.status(200).json({ success: true, message: 'Voucher updated successfully', data: voucher });

        } catch (error) {
            console.error('Error updating voucher:', error);
            res.status(500).json({ success: false, message: 'Error updating voucher', error });
        }
    }
    async createVoucher(req, res) {
        const Data = req.body;
        try {
            const newVoucher = await Discount.create({
                discount_name: Data.discount_name,
                percentage_discount: Data.percentage_discount,
                value_discount: Data.value_discount,
                start_date: Data.start_date,
                end_date: Data.end_date,
                status: 1,
            });

            console.log('Product created successfully:', newVoucher);
            return res.status(201).json({
                voucher: newVoucher,
            });
        } catch (error) {
            // console.log(error)
            res.status(500).json({ success: false, message: 'Error create voucher', error });
        }
    }
    async updateStatus(req, res) {
        const { idVoucher } = req.params;
        const updatedData = req.body;
        try {
            const voucher = await Discount.findOne({
                where: { iddiscount: idVoucher },
            });
            if (!voucher) {
                return res.status(404).json({ message: `No account found with id ${idVoucher}` });
            }
            await voucher.update({
                status: updatedData.status
            });
            console.log(updatedData.status);
            res.status(200).json({ success: true, message: 'User updated successfully', data: updatedData });

        } catch (error) {
            // console.error('Error updating product name:', error);
            res.status(500).json({ success: false, message: 'Error updating product name', error });
        }
    }
    async getBrand(req, res) {
        try {
            const brand = await Brand.findAll();
            res.status(200).json(brand);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching brand', error });
        }

    }
}

module.exports = new AdminController();    
