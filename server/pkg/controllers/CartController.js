const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const Configuration = require('../models/Configuration');
const Cart = require('../models/Cart')
const CartItem = require('../models/CartItem');
const { where, Op} = require('sequelize');
const Discount = require("../models/Discount");

class CartController {
    async loadCartPro(req, res) {
        try {
            const cart = await Cart.findOne({
                where: { idaccount: req.user.id },
                include: [
                    {
                        model: CartItem,
                        attributes: ['idcart_item', 'idproduct', 'idcolor', 'idconfiguration', 'idaccessory', 'quantity'],
                        include: [
                            {
                                model: Product,
                                attributes: ['idproduct', 'product_name', 'brand', 'product_image', 'status'],
                            },
                            {
                                model: Configuration,
                                attributes: ['idconfiguration', 'cpu', 'ram', 'gpu', 'storage', 'screen', 'resolution', 'price', 'quantity'],
                            }
                        ],
                    },
                ],
                attributes: ['idcart', 'idaccount'],
            });

            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            const result = {
                id: cart.idcart,
                cart_items: cart.CartItems.map(item => ({
                    idcart_item: item.idcart_item,
                    product: item.Product
                        ? {
                            idproduct: item.Product.idproduct,
                            name: item.Product.product_name,
                            brand: item.Product.brand,
                            image: item.Product.product_image,
                            status: item.Product.status,
                        } : null,
                    configuration: item.Configuration
                        ? {
                            idconfiguration: item.Configuration.idconfiguration,
                            cpu: item.Configuration.cpu,
                            ram: item.Configuration.ram,
                            gpu: item.Configuration.gpu,
                            storage: item.Configuration.storage,
                            screen: item.Configuration.screen,
                            resolution: item.Configuration.resolution,
                            price: item.Configuration.price,
                            quantity: item.Configuration.quantity,
                        } : null,
                    color: item.idcolor ? { idcolor: item.idcolor } : null,
                    accessory: item.idaccessory ? { idaccessory: item.idaccessory } : null,
                    quantity: item.quantity,
                })),
            };

            // console.log(result);
            return res.json(result);
        } catch (error) {
            console.error('Error fetching cart:', error);
            return res.status(500).json({ error: 'Failed to load cart' });
        }
    }

    // async loadCart(req, res) {
    //     // const { idCart } = req.params; 
    //     try {
    //         const cart = await Cart.findAll();
    //         res.status(200).json(cart);
    //     } catch (error) {
    //         res.status(500).json({ message: 'Error fetching products', error });
    //     }
    // }

    async loadCartById(req,res) {
        const { idCart } = req.params; 
        try {
            const cart = await CartItem.findAll(
                {
                    where: {
                        idcart: idCart
                    }
                }
            );

            res.status(200).json(cart);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching products', error });
        }
    }

    async loadCart(req,res){
        try {
            const id = req.user.id;
            // console.log(id,  req.user.id);
            const cart = await Cart.findByPk({
                where: { idaccount: id }
            })

            res.status(200).json(cart);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching products', error });
        }
    }

    async loadCartItem(req,res){
        const { idCart } = req.params; 
        try {
            const cart_item = await CartItem.findAll(
                {
                    where: {
                        idcart: idCart
                    }
                }
            );
            res.status(200).json(cart_item);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching products', error });
        }
    }

    async addCartItem(req, res) {
        const { idproduct, quantity, idcolor, idconfiguration } = req.body;

        try {
            // Lấy giỏ hàng của người dùng
            const cart = await Cart.findOne({ where: { idaccount: req.user.id } });
            if (!cart) {
                return res.status(400).json({ message: 'Cart not found for the user.' });
            }

            // Tìm xem trong giỏ hàng đã có mục nào với cấu hình sản phẩm tương tự chưa
            let cartItem = await CartItem.findOne({
                where: {
                    idcart: cart.idcart,
                    idproduct: idproduct,
                    idcolor: idcolor,
                    idconfiguration: idconfiguration,
                },
            });

            // Lấy thông tin sản phẩm (giả sử stock lưu trữ số lượng tồn kho)
            // const product = await Product.findOne({ where: { idproduct } });
            // if (!product) {
            //     return res.json({ message: 'Product not found' });
            // }
            // const availableStock = product.stock;

            const config = await Configuration.findByPk(idconfiguration);
            if (!config) {
                return res.json({ message: 'Product not found' });
            }
            const availableStock = config.quantity;

            if (cartItem) {
                // Nếu mục đã tồn tại, tính tổng số lượng sau khi cộng thêm
                const newQuantity = cartItem.quantity + quantity;
                if (newQuantity > availableStock) {
                    return res.status(401).json({ message: 'Not enough stock available' });
                }
                cartItem.quantity = newQuantity;
                await cartItem.save();
                return res.status(200).json({
                    message: 'Cart item updated successfully',
                    cartItem: cartItem,
                });
            } else {
                // Nếu chưa có mục nào, kiểm tra số lượng đặt mua có vượt quá tồn kho không
                if (quantity > availableStock) {
                    return res.status(401).json({ message: 'Not enough stock available' });
                }
                const newCartItem = await CartItem.create({
                    idcart: cart.idcart,
                    idproduct: idproduct,
                    quantity: quantity,
                    idcolor: idcolor,
                    idconfiguration: idconfiguration,
                });
                return res.status(201).json({
                    message: 'Cart item added successfully',
                    cartItem: newCartItem,
                });
            }
        } catch (error) {
            // console.error("Error adding cart item:", error);
            return res.status(500).json({ message: 'Error adding cart item', error });
        }
    }

    async addCartItemOld(req, res) {
        const { idproduct, quantity,idcolor, idconfiguration } = req.body;  // Nhận thông tin từ yêu cầu
            // console.log(req.body)
        try {
            // Tạo một mục mới trong bảng CartItem
            const cart = await Cart.findOne({ where: { idaccount: req.user.id } })

            // if (cart) return;

            const newCartItem = await CartItem.create({
                idcart: cart.idcart,
                idproduct: idproduct,
                quantity: quantity,
                idcolor: idcolor,
                idconfiguration:idconfiguration,
            });
    
            res.status(201).json({
                message: 'Cart item added successfully',
                cartItem: newCartItem
            });
        } catch (error) {
            res.status(500).json({ message: 'Error adding cart item', error });
        }
    }

    async removeCartItem(req, res) {
        const { idcartItem } = req.body;  // Nhận thông tin từ yêu cầu
        // console.log(req.body)
        try {
            // Tạo một mục mới trong bảng CartItem
            const cartItem = await CartItem.findOne(
                {
                    where:{
                        idcart_item: idcartItem
                    }
                }
            )
            await cartItem.destroy()
    
            res.status(201).json({
                message: 'Cart item remove successfully',
                cartItem: cartItem
            });
        } catch (error) {
            res.status(500).json({ message: 'Error adding cart item', error });
        }
    }

    async updateCartItemQuantity(req, res) {
        const { idcart_item, quantity } = req.body;  // Receive item ID and new quantity from the request
        // console.log(req.body);
    
        try {
            const cartItem = await CartItem.findByPk(idcart_item);
    
            if (!cartItem) {
                return res.status(404).json({ message: 'Cart item not found' });
            }
    
            cartItem.quantity = quantity;
            await cartItem.save();  // Save the updated item to the database
    
            res.status(200).json({
                message: 'Cart item quantity updated successfully',
                cartItem: cartItem
            });
        } catch (error) {
            res.status(500).json({ message: 'Error updating cart item quantity', error });
        }
    }

    async loadVoucher(req, res) {
        try {
            const today = new Date().toISOString().split('T')[0];  // Get today's date in YYYY-MM-DD format

            const vouchers = await Discount.findAll({
                where: {
                    status: 1,  // Assuming 1 means "active" vouchers. Adjust if needed.
                    start_date: {
                        [Op.lte]: today,  // Start date should be less than or equal to today
                    },
                    end_date: {
                        [Op.gte]: today,  // End date should be greater than or equal to today
                    }
                }
            });

            // console.log(vouchers);
            res.status(200).json(vouchers);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching vouchers', error });
        }
    }
}

module.exports = new CartController();
