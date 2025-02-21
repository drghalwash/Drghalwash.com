import Photo_Gallaries from "../DB Models/Photo_Gallary.js"

export const index = async (req, res) => {
    try{
        const  Photo_Gallary= await Photo_Gallaries.find({}).lean();
    res.render('Pages/Choose',{Photo_Gallary})
} catch (error) {
    console.error(error);
    res.status(500).render("Pages/404", { error });
}
};
