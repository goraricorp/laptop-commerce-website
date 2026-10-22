const Account = require('../models/Account');
const User = require('../models/User');
const Cart = require('../models/Cart');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const crypto = require('crypto');
require('dotenv').config();

const generateToken = () => {
    return crypto.randomBytes(20).toString('hex');
};

class AuthenticationController {
    async google(req, res) {
        // try {
        //     const { token } = req.body;
        //     console.log(req.body);
        //
        //     // const ticket = await client.verifyIdToken({
        //     //     idToken: token,
        //     //     audience: "YOUR_GOOGLE_CLIENT_ID",
        //     // });
        //     // const payload = ticket.getPayload();
        //     // const userId = payload.sub;
        //
        //     res.status(200).json({ success: true, token: "JWT_TOKEN_HERE" });
        // } catch (error) {
        //     console.error('Google login error:', error);
        //     return res.status(500).json({ message: 'Server error' });
        // }

        try {
            // const { data } = req.body;
            const data = req.body;
            // console.log(data);

            if (!data) {
                return res.status(400).json({ success: false, message: 'Token is required' });
            }

            // const ticket = await client.verifyIdToken({
            //     idToken: token,
            //     audience: process.env.GOOGLE_CLIENT_ID,
            // });

            // const payload = ticket.getPayload();
            // const { email, name, picture } = payload;

            // console.log(data.merge.email);

            let account = await Account.findOne({ where: { email: data.merge.email.toString() } });
            // console.log(account)

            if (!account) {
                account = await Account.create({
                    username: data.merge.email.split('@')[0],
                    email: data.merge.email,
                    password: '', // Vì dùng Google login nên không cần mật khẩu
                    role: 0,
                    status: 1,
                    isverify: 1,
                    method: 'google',
                });

                // const [firstname, ...lastnameParts] = name.split(' ');
                // const lastname = lastnameParts.join(' ');

                await User.create({
                    idaccount: account.idaccount,
                    firstname: data.merge.given_name || null,
                    lastname: data.merge.family_name || null,
                    phone_number: '', // Google không trả số điện thoại, có thể để trống
                    avatar: data.merge.picture, // Sử dụng ảnh đại diện từ Google
                    birthday: null
                });

                await Cart.create({
                    idaccount: account.idaccount
                });
            }

            await Account.update({ status: 1 }, { where: { idaccount: account.idaccount } });

            const jwtToken = jwt.sign({
                id: account.idaccount,
                // email: account.email,
                role: account.role,
                status: account.status
            }, process.env.JWT_SECRET || 'gorth', { expiresIn: '7d' });

            // Trả về thông tin người dùng và token
            // return res.status(200).json({
            //     success: true,
            //     token: jwtToken,
            //     user: {
            //         id: account.idaccount,
            //         email: account.email,
            //         username: account.username,
            //         role: account.role,
            //     },
            // });

            return res.json({ success: true, message: 'Login successful', token: jwtToken });
        } catch (error) {
            // console.error('Google login error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async login(req, res) {
        const { username, password } = req.body;
        try {
            // const account = await Account.findOne({ where: { username, isverify: true } });
            // if (!account) {
            //     return res.status(401).json({ message: 'Invalid username or password' });
            // }

            const account = await Account.findOne({ where: { username } });
            if (!account) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            if (account.status) {
                return res.status(401).json({ message: 'Your account is logged in another device. Please log out first and try again!' });
            }

            if (!account.isverify) {
                return res.status(401).json({ message: 'Account not verified. Please check your email to verify your account.' });
            }

            const validPassword = await bcrypt.compare(password, account.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Your password is incorrect!' });
            }

            await Account.update({ status: 1 }, { where: { idaccount: account.idaccount } });

            const token = jwt.sign({
                id: account.idaccount,
                role: account.role,
                status: account.status,
            }, process.env.JWT_SECRET || 'gorth', { expiresIn: '1d' });

            return res.json({ message: 'Login successful', token });
        } catch (error) {
            // console.error('Login error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async register(req, res) {
        const { username, password, email, firstname, lastname, phone, avatar } = req.body;
        // console.log(req.body)
        try {
            const token = generateToken();
            const existingAccount = await Account.findOne({
                where: { [Op.or]: [{ username }, { email }] }
            });
            if (existingAccount) {
                if (existingAccount.username === username) {
                    return res.status(400).json({ message: 'Username already exists!' });
                }
                if (existingAccount.email === email) {
                    return res.status(400).json({ message: 'Email already exists!' });
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newAccount = await Account.create({
                username,
                password: hashedPassword,
                email,
                role: 0,
                status: 0,
                verificationtoken: token,
                isverify: false,
            });

            const newUser = await User.create({
                idaccount: newAccount.idaccount,
                firstname,
                lastname,
                phone_number: phone,
                // avatar: null,
                birthday: null
            });

            const newCart = await Cart.create({
                idaccount: newAccount.idaccount
            });

            await AuthenticationController.sendConfirmationEmail(email, token, req, res);

            return res.status(201).json({
                message: 'User registered successfully and confirmation email sent',
                account: newAccount,
                user: newUser,
                cart: newCart
            });

        } catch (error) {
            // console.error('Registration error:', error);
            console.log(error);
            return res.status(500).json({ error: 'Error registering user' });
        }
    }

    async logout(req, res) {
        try {
            await Account.update({ status: 0 }, { where: { idaccount: req.user.id } });
            return res.json({ message: 'Logout successful' });
        } catch (error) {
            // console.error('Logout error:', error);
            res.status(500).json({ message: 'Logout failed', error });
        }
    }

    async deactivate(req, res) {
        try {
            await Account.update({ isverify: 0, status: 0 }, { where: { idaccount: req.user.id } });
            return res.json({ message: 'User deactivated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deactivating user' });
        }
    }

    async check(req, res) {
        try {
            const account = await Account.findByPk(req.user.id);
            if (!account) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ role: account.role });
        } catch (error) {
            // console.error('Token validation error:', error);
            res.status(401).json({ message: 'Invalid token' });
        }
    }

    static async sendConfirmationEmail(email, token, req, res) {
        const verificationLink = `http://localhost:5172/authentication/verify-email?token=${token}`;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APSS,
            },
        });
        //process.env.EMAIL_USER
        const mailOptions = {
            from: "Gorth Inc.",
            to: email,
            subject: 'Welcome to Our Service!',
            text: 'Thank you for registering! We are excited to have you on board.',
            html: `<p>Nhấp vào link sau để xác minh tài khoản của bạn:</p><a href="${verificationLink}">Xác minh email</a>`,
        };

        try {
            await transporter.sendMail(mailOptions);
            // console.log('Confirmation email sent successfully');
        } catch (error) {
            // console.error('Error sending confirmation email:', error);
            // console.log(error)
            return res.status(500).json({ error: 'Error registering user' });
        }
    }

    async verifyEmail(req, res) {
        const { token } = req.query;

        const user = await Account.findOne({ where: { verificationtoken: token } });

        if (user) {
            user.isverify = true;
            user.verificationtoken = null;
            await user.save();

            res.send('Email của bạn đã được xác minh thành công!');
        } else {
            res.send('Link xác minh không hợp lệ hoặc đã hết hạn.');
        }
    };

    static async sendResetPasswordEmail(email, token, req, res) {
        const resetUrl = `http://localhost:5173/auth/reset-password?token=${token}`;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APSS,
            },
        });
        //process.env.EMAIL_USER
        const mailOptions = {
            from: "Gorth Inc.",
            to: email,
            subject: 'Reset Password',
            html: `<p>Click the link to reset your password:</p><a href="${resetUrl}">Reset password</a>`,
        };

        try {
            await transporter.sendMail(mailOptions);
            // console.log('Confirmation email sent successfully');
        } catch (error) {
            // console.error('Error sending confirmation email:', error);
            // console.log(error)
            return res.status(500).json({ error: 'Error reset password' });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await Account.findOne({ where: { email: email } });
            if (!user) {
                return res.status(400).json({ message: 'Email không tồn tại!' });
            }

            const token = crypto.randomBytes(20).toString('hex');
            const accountToken = {
                verificationtoken: token
            }

            await user.update(accountToken);
            await AuthenticationController.sendResetPasswordEmail(email, token, req, res);
            res.json({ message: 'Một email đã được gửi để bạn đặt lại mật khẩu!' });
        } catch (error) {
            console.log(error)
        }
    };

    async resetPassword(req, res) {
        const { token, newPassword } = req.body;
        console.log(req.body);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const user = await Account.findOne({
            where: {
                verificationtoken: token,
            }
        });
        if (!user) {
            return res.status(400).json({ message: 'Token không hợp lệ!' });
        }
        const userData = {
            password: hashedPassword,
            verificationtoken: null
        }
        await user.update(userData);
        res.json({ message: 'Mật khẩu của bạn đã được đặt lại' });
    };

    async changePassword(req, res) {
        try {
            const account = await Account.findOne({
                where: {
                    username: req.body.username
                }
            });
            const isMatch = await bcrypt.compare(req.body.oldPassword, account.password)
            const hashedPassword1 = await bcrypt.hash(req.body.newPassword, 10);
            // console.log(account, accuser)
            if (isMatch) {
                const dataAccount = {
                    password: hashedPassword1
                }
                await account.update(dataAccount);
                res.status(200).json({ error: 'Your password have been change.' });
            } else {
                res.status(404).json({ error: 'Old password is not correct.' });
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new AuthenticationController();
