"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const email_1 = __importDefault(require("../views/email"));
const sendEmail = (to, subject, templateName, templateData) => __awaiter(void 0, void 0, void 0, function* () {
    // Render the email template
    const html = (0, email_1.default)(templateName, templateData);
    // Configure the email transporter
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.EMAIL_HOST, // Replace with your SMTP host
        port: 587, // Replace with your SMTP port (typically 587 or 465)
        secure: false, // True for 465, false for other ports
        auth: {
            user: process.env.EMAIL_FROM_ADDRESS, // Replace with your SMTP user
            pass: process.env.EMAIL_FROM_PASSWORD, // Replace with your SMTP password
        },
        tls: {
            // Do not fail on invalid certs
            rejectUnauthorized: false
        }
    });
    // Define the email options
    const mailOptions = {
        from: process.env.EMAIL_FROM_ADDRESS, // replace with your email
        to,
        subject,
        html,
    };
    // Send the email
    try {
        yield transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    }
    catch (error) {
        console.error('Error sending email:', error);
    }
});
exports.default = sendEmail;
