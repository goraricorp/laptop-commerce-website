const express = require('express');
require('dotenv').config();
const axios = require('axios');
const RECAPTCHA_SECRET_KEY = process.env.SecretKey;

const router = express.Router();

router.post('/verify-captcha', async (req, res) => {
    const { captcha } = req.body;

    if (!captcha) {
        return res.status(400).json({ success: false, message: 'Captcha token is required' });
    }

    try {
        // console.log(1)
        const googleResponse = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            { params: { secret: RECAPTCHA_SECRET_KEY, response: captcha } }
        );
        // console.log(googleResponse)
        if (googleResponse.data.success) {
            return res.json({ success: true });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid captcha' });
        }
    } catch (error) {

        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;