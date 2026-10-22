const jwt = require('jsonwebtoken');

const AuthenticationMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token format invalid' });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET || 'gorth', (err, user) => {
            req.user = user;
            next();
        });

        // const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gorth');
        // req.token = decoded; // Lưu thông tin token vào req
        // next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }

    // try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gorth');
    //     req.user = decoded;
    //
    //     const account = await Account.findOne({where: {idaccount: decoded.id}});
    //
    //     if (!account || account.status !== 1) {
    //         return res.status(401).json({message: 'User not logged in or status is not active'});
    //     }
    //
    //     next();
    // } catch (error) {
    //     return res.status(401).json({message: 'Unauthorized', error});
    // }

    // try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //     req.user = decoded;
    //     next();
    // } catch (error) {
    //     return res.status(401).json({message: 'Unauthorized'});
    // }
};

module.exports = AuthenticationMiddleware;
