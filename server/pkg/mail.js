const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: "uipackgorth@gmail.com",
        pass: "vprj acmu qtgb qwny"
    }
})

transporter.sendMail({
    to: "goraricorp@gmail.com",
    subject: "Gorth",
    html: "<h1>Test</h1>"
}).then(() => {
    console.log("Email sent")
}).catch((error) => {
    console.error("Error sending email:", error)
})