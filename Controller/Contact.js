import dotenv from "dotenv";
dotenv.config();

import Contact from "../DB Models/Contact.js"
import Photo_Gallaries from "../DB Models/Photo_Gallary.js"

import nodemailer from "nodemailer";

// Create a transporter
const transporter = nodemailer.createTransport({
    service: "gmail", // Use your email service (e.g., Gmail, Outlook)
    auth: {
        user: process.env.Sender_Email, // Your email address
        pass: process.env.Sender_App_Password, // Your email password or app-specific password
    },
});

// Function to send an email
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: process.env.Sender_Email,
        to,
        subject,
        text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error sending email:", error);
        } else {
            console.log("Email sent:", info.response);
        }
    });
};

export const index = async (req, res) => {
    try {
        const Photo_Gallary = await Photo_Gallaries.find({}).lean();
        res.render('Pages/Contact', { Photo_Gallary })
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};
export const Save = async (req, res) => {
    try {
        const { name, email, phone, procedures, questions } = req.body;
        await Contact.create({
            name,
            email,
            phone,
            procedures,
            questions
        });
        // Send email to admin
        const emailSubject = name ;
        const emailText = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nprocedure: ${procedures}\n\nMessage:  ${questions}`;

        // Send email to info@domain.com

        sendEmail(process.env.Receiver_Email, emailSubject, emailText);
        res.redirect('/Contact')
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};
