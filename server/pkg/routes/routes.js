const AuthenticationRoute = require('./AuthenticationRoute')
const CategoryRoute = require('./CategoryRoute')
const ProductRouter = require('./ProductRoute')
const AddressRoute = require('./AddressRoute');
const AccountRoute = require('./AccountRoute')
const AdminRoute = require('./AdminRoute')
const CartRoute = require('./CartRoute')
const BillRoute = require('./BillRoute')
const PaypalRoute = require('./PaypalRoute')
const RecaptchaRoute = require('./RecaptchaRoute'); //
const ConversationRoute = require('./ConversationRoute')
const routes = (app) => {
    app.use('/authentication', AuthenticationRoute);
    app.use('/category', CategoryRoute);
    app.use('/products', ProductRouter);
    app.use('/cart', CartRoute);
    app.use('/bill', BillRoute);
    app.use('/address', AddressRoute);
    app.use('/admin', AdminRoute);
    app.use('/account', AccountRoute);
    app.use('/paypal', PaypalRoute);
    app.use('/recaptcha', RecaptchaRoute);
    app.use('/chatbot',ConversationRoute);
}

module.exports = routes;