const Address = require('../models/Address');
const Account = require('../models/Account')

class AddressController {
    async getAllAddresses(req, res) {
        try {
            const addresses = await Address.findAll({ where: { idaccount: req.user.id } });
            // console.log(addresses);
            res.json(addresses);
        } catch (error) {
            res.status(500).json({ error: 'Có lỗi xảy ra khi lấy dữ liệu' });
        }
    };

    async getAddressById(req, res) {
        const { idaddress } = req.params;
        try {
            const address = await Address.findAll(
                {
                    where: {
                        idaddress: idaddress
                    }
                }
                );
            if (address) {
                res.json(address);
            } else {
                res.status(404).json({ error: 'Địa chỉ không tồn tại' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Có lỗi xảy ra khi lấy dữ liệu' });
        }
    };

    async createAddress(req, res) {
        const idaccount = req.user.id;
        const { type, tower, street, district, city, state, country } = req.body;
        // console.log(idaccount, req.body);
        try {
            const newAddress = await Address.create({
                idaccount: req.user.id,
                type,
                tower,
                street,
                district,
                city,
                state,
                country
            });
            res.status(201).json(newAddress);
        } catch (error) {
            res.status(500).json({ error: 'Có lỗi xảy ra khi thêm địa chỉ' });
        }
    };

    async updateAddress(req, res) {
        try {
            const address = await Address.findByPk(req.params.idaddress);
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

    async deleteAddress(req, res) {
        try {
            const address = await Address.findByPk(req.params.idaddress);

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

module.exports = new AddressController();