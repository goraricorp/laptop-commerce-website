// controllers/AccountController.js
const Account = require('../models/Account');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const axios = require("axios");
require('dotenv').config();

class ConversationController {
    async getHistory(req, res) {
        try {
            const conversations = await Conversation.findAll({
                where: {idaccount: req.user.id},
                include: [
                    {
                        model: Account,
                        attributes: ['idaccount', 'username'],
                        include: [{
                            model: User,
                            attributes: ['avatar', 'firstname', 'lastname'],
                        }]
                    }
                ],
                attributes: ['id', 'idaccount', 'type', 'message', 'time'],
            });

            if (!conversations || conversations.length === 0) {
                console.log("Không tìm thấy hội thoại");
                return res.status(404).json({message: 'Conversation not found'});
            }

            const result = conversations.map((item) => ({
                id: item.id,
                type: item.type,
                message: item.message,
                time: item.time,
                user: item.Account && item.Account.User ? {
                    idaccount: item.Account.idaccount,
                    username: item.Account.username,
                    avatar: item.Account.User.avatar,
                    firstname: item.Account.User.firstname,
                    lastname: item.Account.User.lastname
                } : null,
            }));

            res.json(result);
        } catch (error) {
            res.json({error: 'Server error'});
        }
    }

    async requestMessage(req, res) {

        try {
            const account = await Account.findByPk(req.user.id);

            if (!account) {
                res.json({error: 'Account not found'});
            }
            const userMessage = await Conversation.create({
                idaccount: account.idaccount,
                message: req.body.message,
                time: new Date(),
                type: "user",
            })

            const userMess = req.body.message;
            const response = await axios.post(process.env.RASA_URL, {
                // sender: "user",
                message: userMess,
            });
            console.log(response.data.text)
            const rasaReply = response.data.map((msg) => msg.text).join("\n");
            const result = {
                type: "bot",
                user: {
                    idaccount: account.idaccount,
                    username: "bot",
                    avatar: "/assets/img/avatars/0.png",
                    firstname: "Bill",
                    lastname: "Cipher"
                },
                message: rasaReply.toString(),
                time: new Date(),
            }
            console.log(rasaReply)
            const botMessage = await Conversation.create({
                idaccount: account.idaccount,
                message: rasaReply.toString(),
                time: new Date(),
                type: "bot",
            })
            res.json(rasaReply);
        } catch (error) {
            // console.error('Lỗi khi cập nhật thông tin tài khoản và người dùng:', error);
            // console.log(error);
            res.status(500).json({error: 'Có lỗi xảy ra khi cập nhật thông tin'});
        }
    }

    async responseMessage(req, res) {
        try {
            const userMessage = req.body.message;
            const response = await axios.post(process.env.RASA_URL, {
                sender: "user",
                message: userMessage,
            });

            const rasaReply = response.data.map((msg) => msg.text).join("\n");

            res.json({reply: rasaReply});
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({error: "Server error"});
        }
    }
}

module.exports = new ConversationController();