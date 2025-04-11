// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Apply security headers
app.use(helmet());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// POST endpoint for the Request Appointment form with reCAPTCHA verification
app.post('/submit-form', async (req, res) => {
  const { name, email, message, recaptchaToken } = req.body;
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken
        }
      }
    );
    const { success, score, action } = response.data;
    if (success && score >= 0.5 && action === 'submit') {
      sendEmail(name, email, message);
      return res.status(200).json({ message: 'Form submitted successfully.' });
    } else {
      return res.status(400).json({ message: 'reCAPTCHA verification failed.' });
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// Function to send email using Nodemailer
function sendEmail(name, email, message) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: 'New Request Appointment Submission',
    text: `Message from ${name} (${email}):\n\n${message}`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
