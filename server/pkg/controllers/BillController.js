const Bill = require('../models/Bill');
const BillDetail = require('../models/BillDetail')
const Product = require('../models/Product')
const Color = require('../models/Color');
const Configuration = require('../models/Configuration');
// const Accessory = require('../models/Accessory');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Discount = require('../models/Discount');
const Address = require('../models/Address');
const Account = require('../models/Account');
const User = require('../models/User');

class BillController {
    async getAllBill(req, res) {
        try {
            const bills = await Bill.findAll({
                attributes: ['idbill', 'iddiscount', 'date', 'status'], // Chỉ lấy các trường cần thiết từ Bill
                include: [
                    {
                        model: Account,
                        attributes: ['idaccount', 'username', 'email'], // Chỉ lấy các trường cần thiết từ Account
                        include: [
                            {
                                model: User,
                                attributes: ['iduser', 'firstname', 'lastname', 'phone_number', 'avatar'], // Các trường cần từ User
                            }
                        ]
                    }
                ]
            });

            const result = bills.map(bill => ({
                id: bill.idbill,
                date: bill.date,
                price: bill.price,
                status: bill.status,
                account: bill.Account ? {
                    idaccount: bill.Account.idaccount,
                    username: bill.Account.username,
                    email: bill.Account.email,
                    user: bill.Account.User ? {
                        iduser: bill.Account.User.iduser,
                        firstname: bill.Account.User.firstname,
                        lastname: bill.Account.User.lastname,
                        phone_number: bill.Account.User.phone_number,
                        avatar: bill.Account.User.avatar
                    } : null
                } : null,
                address: bill.Address ? {
                    idaddress: bill.Address.idaddress,
                    tower: bill.Address.tower,
                    street: bill.Address.street,
                    district: bill.Address.district,
                    city: bill.Address.city,
                    state: bill.Address.state,
                    country: bill.Address.country,
                } : null,
                discount: bill.Discount ? {
                    iddiscount: bill.Discount.iddiscount,
                    discount_name: bill.Discount.discount_name,
                    percentage_discount: bill.Discount.percentage_discount,
                    start_date: bill.Discount.start_date,
                    end_date: bill.Discount.end_date
                } : null,
                bill_details: bill.BillDetails ? bill.BillDetails.map(detail => ({
                    idbill_detail: detail.idbill_details,
                    product: detail.Product ? detail.Product.product_name : null,
                    brand: detail.Product ? detail.Product.brand : null,
                    price: detail.price,
                    configuration: detail.Configuration ? {
                        cpu: detail.Configuration.cpu,
                        ram: detail.Configuration.ram,
                        gpu: detail.Configuration.gpu,
                        storage: detail.Configuration.storage,
                        screen: detail.Configuration.screen,
                        resolution: detail.Configuration.resolution,
                    } : null,
                    color: detail.Color ? detail.Color.color : null,
                    quantity: detail.quantity
                })) : []
            }));

            res.json(result);
        } catch (error) {
            console.error('Error fetching bills:', error);
            res.status(500).json({ error: 'Có lỗi xảy ra khi lấy dữ liệu' });
        }
    };

    async getAllBillByAccount(req, res) {
        const user = req.user.id;
        // console.log(user);
        try {
            const bills = await Bill.findAll({
                where: { idaccount: req.user.id }, // Lọc theo idaccount
                attributes: ['idbill', 'price', 'date', 'status'], // Các trường từ Bill
                include: [
                    {
                        model: Account,
                        attributes: ['idaccount', 'username', 'email'], // Thông tin Account
                        include: [
                            {
                                model: User,
                                attributes: ['iduser', 'firstname', 'lastname', 'phone_number'], // Thông tin User
                            },
                        ],
                    },
                    {
                        model: Discount,
                        attributes: ['iddiscount', 'discount_name', 'percentage_discount', 'start_date', 'end_date'], // Thông tin Discount
                    },
                    {
                        model: Address,
                        attributes: ['idaddress', 'tower', 'street', 'district', 'city', 'state', 'country'], // Thông tin Address
                    },
                    {
                        model: BillDetail,
                        attributes: ['idbill_details', 'product_name', 'quantity', 'price'], // Các trường từ BillDetail
                        include: [
                            {
                                model: Product,
                                attributes: ['product_name', 'brand'], // Thông tin Product
                            },
                            {
                                model: Color,
                                attributes: ['color'], // Thông tin Color
                            },
                            {
                                model: Configuration,
                                attributes: ['cpu', 'ram', 'gpu', 'storage', 'screen', 'resolution'], // Thông tin Configuration
                            },
                        ],
                    },
                ],
            });

            const result = bills.map(bill => ({
                id: bill.idbill,
                date: bill.date,
                price: bill.price,
                status: bill.status,
                account: bill.Account ? {
                    idaccount: bill.Account.idaccount,
                    username: bill.Account.username,
                    email: bill.Account.email,
                    user: bill.Account.User ? {
                        iduser: bill.Account.User.iduser,
                        firstname: bill.Account.User.firstname,
                        lastname: bill.Account.User.lastname,
                        phone_number: bill.Account.User.phone_number,
                    } : null,
                } : null,
                address: bill.Address ? {
                    idaddress: bill.Address.idaddress,
                    tower: bill.Address.tower,
                    street: bill.Address.street,
                    district: bill.Address.district,
                    city: bill.Address.city,
                    state: bill.Address.state,
                    country: bill.Address.country,
                } : null,
                discount: bill.Discount ? {
                    iddiscount: bill.Discount.iddiscount,
                    discount_name: bill.Discount.discount_name,
                    percentage_discount: bill.Discount.percentage_discount,
                    start_date: bill.Discount.start_date,
                    end_date: bill.Discount.end_date,
                } : null,
                bill_details: bill.BillDetails.map(detail => ({
                    idbill_detail: detail.idbill_details,
                    product: detail.Product ? detail.Product.product_name : null,
                    brand: detail.Product ? detail.Product.brand : null,
                    price: detail.price,
                    quantity: detail.quantity,
                    color: detail.Color ? detail.Color.color : null,
                    configuration: detail.Configuration ? {
                        cpu: detail.Configuration.cpu,
                        ram: detail.Configuration.ram,
                        gpu: detail.Configuration.gpu,
                        storage: detail.Configuration.storage,
                        screen: detail.Configuration.screen,
                        resolution: detail.Configuration.resolution,
                    } : null,
                })),
            }));

            result.sort((up, down) => new Date(down.date) - new Date(up.date));

            // console.log(result);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Có lỗi xảy ra khi lấy dữ liệu' });
        }
    };

    async getBillById(req, res) {
        // const user = req.user.id;
        const { id } = req.params;

        try {
            // Tìm hóa đơn theo id và idaccount của người dùng
            const bill = await Bill.findOne({
                where: { idaccount: req.user.id, idbill: id }, // Lọc theo idaccount
                attributes: ['idbill', 'price', 'date', 'status'], // Các trường từ Bill
                include: [
                    {
                        model: Account,
                        attributes: ['idaccount', 'username', 'email'], // Thông tin Account
                        include: [
                            {
                                model: User,
                                attributes: ['iduser', 'firstname', 'lastname', 'phone_number', 'avatar'], // Thông tin User
                            },
                        ],
                    },
                    {
                        model: Discount,
                        attributes: ['iddiscount', 'discount_name', 'percentage_discount', 'start_date', 'end_date'], // Thông tin Discount
                    },
                    {
                        model: Address,
                        attributes: ['idaddress', 'tower', 'street', 'district', 'city', 'state', 'country'], // Thông tin Address
                    },
                    {
                        model: BillDetail,
                        attributes: ['idbill_details', 'product_name', 'quantity', 'price'], // Các trường từ BillDetail
                        include: [
                            {
                                model: Product,
                                attributes: ['product_name', 'brand', "product_image"], // Thông tin Product
                            },
                            {
                                model: Color,
                                attributes: ['color'], // Thông tin Color
                            },
                            {
                                model: Configuration,
                                attributes: ['cpu', 'ram', 'gpu', 'storage', 'screen', 'resolution'], // Thông tin Configuration
                            },
                        ],
                    },
                ],
            });

            const count =  await Bill.count({ where: { idaccount: req.user.id } })

            if (!bill) {
                return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
            }

            const result = {
                id: bill.idbill,
                date: bill.date,
                price: bill.price,
                status: bill.status,
                count: count,
                account: bill.Account ? {
                    idaccount: bill.Account.idaccount,
                    username: bill.Account.username,
                    email: bill.Account.email,
                    user: bill.Account.User ? {
                        iduser: bill.Account.User.iduser,
                        firstname: bill.Account.User.firstname,
                        lastname: bill.Account.User.lastname,
                        phone_number: bill.Account.User.phone_number,
                        avatar: bill.Account.User.avatar,
                    } : null,
                } : null,
                address: bill.Address ? {
                    idaddress: bill.Address.idaddress,
                    tower: bill.Address.tower,
                    street: bill.Address.street,
                    district: bill.Address.district,
                    city: bill.Address.city,
                    state: bill.Address.state,
                    country: bill.Address.country,
                } : null,
                discount: bill.Discount ? {
                    iddiscount: bill.Discount.iddiscount,
                    discount_name: bill.Discount.discount_name,
                    percentage_discount: bill.Discount.percentage_discount,
                    start_date: bill.Discount.start_date,
                    end_date: bill.Discount.end_date,
                } : null,
                bill_details: bill.BillDetails.map(detail => ({
                    idbill_detail: detail.idbill_details,
                    product: detail.Product ? detail.Product.product_name : null,
                    brand: detail.Product ? detail.Product.brand : null,
                    image: detail.Product ? detail.Product.product_image : null,
                    price: detail.price,
                    quantity: detail.quantity,
                    color: detail.Color ? detail.Color.color : null,
                    configuration: detail.Configuration ? {
                        cpu: detail.Configuration.cpu,
                        ram: detail.Configuration.ram,
                        gpu: detail.Configuration.gpu,
                        storage: detail.Configuration.storage,
                        screen: detail.Configuration.screen,
                        resolution: detail.Configuration.resolution,
                    } : null,
                })),
            };

            res.json(result); // Trả về một phần tử duy nhất
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Có lỗi xảy ra khi lấy dữ liệu' });
        }
    }

    async createBill(req, res) {
        const { date, voucher, address, price, status, items } = req.body;

        try {
            // Kiểm tra dữ liệu bắt buộc
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.json({ message: 'No products selected for purchase.' });
            }
            if (!address) {
                return res.json({ message: 'Please choose your address before purchase.' });
            }
            if (!status) {
                return res.json({ message: 'Purchase status is required.' });
            }
            if (!price) {
                return res.json({ message: 'Purchase price is required.' });
            }

            // Lấy giỏ hàng của người dùng
            const cart = await Cart.findOne({ where: { idaccount: req.user.id } });
            if (!cart) {
                return res.status(400).json({ message: 'User cart not found.' });
            }

            // Tạo hóa đơn mới
            const newBill = await Bill.create({
                idaccount: req.user.id,
                iddiscount: voucher ? voucher.iddiscount : null,
                idaddress: address.idaddress,
                date: date,
                price: price,
                status: status,
            });

            // Duyệt từng sản phẩm trong đơn hàng
            for (const item of items) {
                // Lấy thông tin cấu hình của sản phẩm từ bảng Configuration
                const configuration = await Configuration.findOne({
                    where: { idconfiguration: item.configuration.idconfiguration },
                });
                if (!configuration) {
                    return res.status(404).json({
                        message: `Configuration not found for product: ${item.product.name}`,
                    });
                }

                // Kiểm tra số lượng tồn kho có đủ không
                const newQuantity = configuration.quantity - item.quantity;
                if (newQuantity < 0) {
                    return res.status(400).json({
                        message: `Not enough stock for product: ${item.product.name}`,
                    });
                }

                // Tạo chi tiết hóa đơn cho sản phẩm đó
                await BillDetail.create({
                    idbill: newBill.idbill,
                    idproduct: item.product.idproduct,
                    idaccessory: item.accessory ? item.accessory.idaccessory : null,
                    idcolor: item.color ? item.color.idcolor : null,
                    idconfiguration: item.configuration.idconfiguration,
                    product_name: item.product.name,
                    quantity: item.quantity,
                    price: item.configuration.price,
                });

                // Cập nhật số lượng tồn kho trong Configuration
                configuration.quantity = newQuantity;
                await configuration.save();

                // Xoá item đã mua khỏi giỏ hàng (CartItem)
                await CartItem.destroy({
                    where: {idcart_item: item.idcart_item},
                });
            }

            return res.status(201).json(newBill);
        } catch (error) {
            console.error("Error creating bill:", error);
            return res.status(500).json({ error: 'An error occurred while creating the bill.' });
        }
    }

    async createBillOld(req, res) {
        const { date, voucher, address, price, status, items } = req.body;

        try {
            // if (!address || !price || !status || !items || items.length === 0) {
            //     return res.status(400).json({ message: 'Data is invalid!, Dữ liệu không hợp lệ' });
            // }

            // if (!items || items.length === 0) {
            //     return res.json({ message: 'Not have any product to purchase!' });
            // } else if (!address) {
            //     return res.json({ message: 'Please choose your address before purchase!' });
            // } else if (!status) {
            //     return res.json({ message: 'Not have status to purchase!' });
            // } else if (!price) {
            //     return res.json({ message: 'Not have price to purchase!' });
            // } else if (!address || !price || !status || !items || items.length === 0) {
            //     return res.json({ message: 'Data is invalid!' });
            // }

            const newBill = await Bill.create({
                idaccount: req.user.id,
                iddiscount: voucher ? voucher.iddiscount : null,
                idaddress: address.idaddress,
                date: date,
                price: price,
                status: status
            });

            for (const e of items) {
                await BillDetail.create({
                    idbill: newBill.idbill,
                    idproduct: e.product.idproduct,
                    idaccessory: e.accessory ? e.accessory.idaccessory : null,
                    idcolor: e.color ? e.color.idcolor : null,
                    idconfiguration: e.configuration.idconfiguration,
                    product_name: e.product.name,
                    quantity: e.quantity,
                    price: e.configuration.price
                });
            }

            res.status(201).json(newBill);
        } catch (error) {
            // console.error('Lỗi server khi tạo hóa đơn:', error);
            res.status(500).json({ error: 'Có lỗi xảy ra khi thêm bill' });
        }
    }

    async createBillDetail(req, res) {
        const { idbill, idproduct, idcolor, idconfiguration, quantity, price } = req.body;
        // console.log( req.body);
        try {
            const newBillDetail = await BillDetail.create({
                idbill: idbill,
                idproduct: idproduct,
                idcolor:idcolor,
                idconfiguration:idconfiguration,
                quantity:quantity,
                price:price
            });
            res.status(201).json(newBillDetail);
        } catch (error) {
            res.status(500).json({ error: 'Có lỗi xảy ra khi thêm billDetail' });
        }
    };

    async updateBill(req, res) {
        try {
            const address = await Bill.findByPk(req.params.idaddress);
            if (address) {
                await address.update(req.body);
                res.json(address);
            } else {
                res.status(404).json({ error: 'Địa chỉ không tồn tại' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Có lỗi xảy ra khi cập nhật địa chỉ' });
        }
    };

    async deleteBill(req, res) {
        try {
            const address = await Bill.findByPk(req.params.idaddress);

            if (!address) {
                return res.status(404).json({ error: "Address not found" });
            }

            await address.destroy();
            res.status(200).json({ message: "Address deleted successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to delete address" });
        }
    }
}

module.exports = new BillController();