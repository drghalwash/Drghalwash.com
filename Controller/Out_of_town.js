
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

export const index = async (req, res) => {
    try {
        const { data: galleries, error } = await supabase.from('gallery').select('*');
        if (error) throw error;
        res.render('Pages/Out of Town/Out_of_town', { galleries });
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};

export const Concierge_Services = async (req, res) => {
    try {
        const { data: galleries, error } = await supabase.from('gallery').select('*');
        if (error) throw error;
        res.render('Pages/Out of Town/Concierge_Services', { galleries });
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};

export const Consultation_Process = async (req, res) => {
    try {
        const { data: galleries, error } = await supabase.from('gallery').select('*');
        if (error) throw error;
        res.render('Pages/Out of Town/Consultation_Process', { galleries });
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};

export const Hotels_Accommodations = async (req, res) => {
    try {
        const { data: galleries, error } = await supabase.from('gallery').select('*');
        if (error) throw error;
        res.render('Pages/Out of Town/Hotels_Accommodations', { galleries });
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};

export const Alexandria_Attractions = async (req, res) => {
    try {
        const { data: galleries, error } = await supabase.from('gallery').select('*');
        if (error) throw error;
        res.render('Pages/Out of Town/Alexandria_Attractions', { galleries });
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};
