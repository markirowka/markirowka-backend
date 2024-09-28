import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import renderTemplate from '../views/email';

const sendEmail = async (to: string, subject: string, templateName: string, templateData: object, attachmentFilePaths?: string[]) => {
    // Render the email template
    const html = renderTemplate(templateName, templateData);
  
    // Configure the email transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // Replace with your SMTP host
        port: 465, // Replace with your SMTP port (typically 587 or 465)
        secure: true, // True for 465, false for other ports
        auth: {
          user: process.env.EMAIL_FROM_ADDRESS, // Replace with your SMTP user
          pass: process.env.EMAIL_FROM_PASSWORD, // Replace with your SMTP password
        },
        tls: {
          // Do not fail on invalid certs
          rejectUnauthorized: false
        }
    });

    const mailAttachments: {
      filename: any,
      content: any
    }[] = [];

    attachmentFilePaths?.forEach((f) => {
      try {
        const attachmentContent = fs.readFileSync(f);
        const attachmentFileName = path.basename(f);
  
        mailAttachments.push({
          filename: attachmentFileName,
          content: attachmentContent
        })

      } catch (error) {
        console.error('Error reading attachment file:', error);
      }
    })
  
    const mailOptions = {
      from: process.env.EMAIL_FROM_ADDRESS, 
      to,
      subject,
      html,
      attachments: mailAttachments 
    };
  
    // Send the email
    try {
      const sendResult = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully', sendResult);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
  
  export default sendEmail;