import Photo_Gallaries from "../DB Models/Photo_Gallary.js"

export const index = async (req, res) => {
    try{
        const  Photo_Gallary= await Photo_Gallaries.find({}).lean();
    res.render('Pages/Out of Town/Out_of_town',{Photo_Gallary})
} catch (error) {
    console.error(error);
    res.status(500).render("Pages/404", { error });
}
};
export const Concierge_Services = async (req, res) => {
    try{
        const  Photo_Gallary= await Photo_Gallaries.find({}).lean();
    res.render('Pages/Out of Town/Concierge_Services',{Photo_Gallary})
} catch (error) {
    console.error(error);
    res.status(500).render("Pages/404", { error });
}
};
export const Consultation_Process = async (req, res) => {
    try{
        const  Photo_Gallary= await Photo_Gallaries.find({}).lean();
    res.render('Pages/Out of Town/Consultation_Process',{Photo_Gallary})
} catch (error) {
    console.error(error);
    res.status(500).render("Pages/404", { error });
}
};
export const Hotels_Accommodations = async (req, res) => {
    try{
        const  Photo_Gallary= await Photo_Gallaries.find({}).lean();
    res.render('Pages/Out of Town/Hotels_Accommodations',{Photo_Gallary})
} catch (error) {
    console.error(error);
    res.status(500).render("Pages/404", { error });
}
};

export const Alexandria_Attractions = async (req, res) => {
    try{
        const  Photo_Gallary= await Photo_Gallaries.find({}).lean();
    res.render('Pages/Out of Town/Alexandria_Attractions',{Photo_Gallary})
} catch (error) {
    console.error(error);
    res.status(500).render("Pages/404", { error });
}
};
