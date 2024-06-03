const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, 
  auth: {
    user: "sahilkhambhayata@gmail.com",
    pass: "yyit mgzj ktrr dgqa",
  },
});

async function sendMail(subject, email, text, html) {


  const info = await transporter.sendMail({
    from: '"sahilkhambhayata@gmail.com 👻" <pansuriyaavi8787@gmail.com.email>',
    to: email,
    subject: subject,
    text: text,
    html: html,
  });

  console.log("Message sent: %s", info.messageId);
}

module.exports = sendMail;
