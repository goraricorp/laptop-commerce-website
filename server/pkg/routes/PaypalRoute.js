const paypal = require('@paypal/checkout-server-sdk');
const express = require('express');
const router = express.Router();
const clientId = "AdhVzROq2s2WBCyzBViwG2txjK55M54O6K_swNa_do0hEpOGo5PQf49TYCoz3evn0s3PF_jdXovGzKb3";
const clientSecret = "EALHK07knsgagn0Y4VKpl-QeJHQPZed43mKIg8f6qeu-28hm0_3MLc8B6mNWoVIHjne1IezlsIsOccrv";

const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

router.post('/create-order', async (req, res) => {
    const { totalPrice } = req.body;
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: totalPrice
            }
        }]
    });

    try {
        const order = await client.execute(request);
        res.json({ id: order.result.id });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi tạo giao dịch thanh toán');
    }
});
router.post('/capture-order', async (req, res) => {
    const { orderID } = req.body;
    console.log(orderID);
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const capture = await client.execute(request);
        res.json({ status: 'success', details: capture.result });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi xác nhận thanh toán');
    }
});

module.exports = router;