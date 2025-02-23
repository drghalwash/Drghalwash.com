
import { createClient } from '@supabase/supabase-js';
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.Sender_Email,
        pass: process.env.Sender_App_Password,
    },
});

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
        const { data: galleries, error } = await supabase.from('gallery').select('*');
        if (error) throw error;
        res.render('Pages/Contact', { galleries });
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};

export const Save = async (req, res) => {
    try {
        const { name, email, phone, procedures, questions } = req.body;
        
        const { error } = await supabase.from('Contact').insert([{
            name,
            email,
            phone,
            procedures,
            questions
        }]);
        
        if (error) throw error;

        const emailSubject = name;
        const emailText = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nprocedure: ${procedures}\n\nMessage: ${questions}`;
        
        sendEmail(process.env.Receiver_Email, emailSubject, emailText);
        res.redirect('/Contact');
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};
