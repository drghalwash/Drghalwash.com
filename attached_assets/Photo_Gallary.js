import Photo_Gallaries from "../DB Models/Photo_Gallary.js"
import Photo_Gallary_images from "../DB Models/Photo_Gallary_images.js"
import Password from "../DB Models/Passwords.js"
import jwt from "jsonwebtoken"


export const index = async (req, res) => {
    try {
        const { id } = req.params;

        const Photo_Gallary = await Photo_Gallaries.findById(id).lean();
        const Photo_Gallaries_images = await Photo_Gallary_images.find({ Photo_Gallary: id }).lean();
        const Photo_Gallariess = await Photo_Gallaries.find({}).lean();

        let rowsHtml = '';
        let rowType = 'first-row';
        let rowCount = 0;
        let maxItems = rowType === 'first-row' ? 5 : 4;
        let currentRowItems = [];

        Photo_Gallaries_images.forEach((image, index) => {
            const divClass = image.Status === 'Public' ? 'custom-div' : 'custom-div-private';

            const iconSrc = "/images/Photo Gallery/" + image.icon || '/images/default-icon.png';
            const title = image.name || 'No Title';
            const id = image._id.toString(); // or image._id.toHexString()
            const onClickAction = image.Status === 'Public'
                ? `onclick="window.location.href='/Photo_Gallary/Public_images/${id}'"`
                : `onclick="openModal('${id}')"`;



            const divHtml = `
                <div class="${divClass}" ${onClickAction}>
                    <img class="icons" src="${iconSrc}" alt="Icon for ${title}">
                    <p>${title}</p>
                </div>
            `;
            currentRowItems.push(divHtml);
            rowCount++;

            if (rowCount === maxItems || index === Photo_Gallaries_images.length - 1) {
                rowsHtml += `
                    <div class="custom-row ${rowType}">
                        ${currentRowItems.join('')}
                    </div>
                `;
                rowCount = 0;
                rowType = rowType === 'first-row' ? 'second-row' : 'first-row';
                maxItems = rowType === 'first-row' ? 5 : 4;
                currentRowItems = [];
            }
        });
        res.render('Pages/Photo_Gallary', {
            Photo_Gallary,
            Photo_Gallariess,
            Photo_Gallaries_images,
            rowsHtml,
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('Pages/404', { error });
    }
};


export const Public_images = async (req, res) => {
    try {
        const { id } = req.params;
        const Photo_Gallaries_images = await Photo_Gallary_images.findOne({ _id: id }).lean();
        const First_Image = Photo_Gallaries_images.images[0]
        const all_images = Photo_Gallaries_images.images.slice(1);  // All remaining images excluding the first one
        const Photo_Gallariess = await Photo_Gallaries.find({}).lean();

        res.render('Pages/Gallery', { Photo_Gallaries_images, Photo_Gallariess, First_Image, all_images })
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};

export const Private_images = async (req, res) => {
    try {
        const { id, password } = req.body;

        // Retrieve the admin and passwords array
        const passwords = await Password.find({}).lean();
        // Initialize an empty array to store all passwords
        const all_passwords = [];

        // Loop through each document and push the passwords into the array
        passwords.forEach(passwordRecord => {
                all_passwords.push(passwordRecord.password); // Assuming 'passwords' is an array in each document
        }); 
        // Decrypt passwords and check if any matches the provided password
        const isPasswordValid = all_passwords.some((encryptedPassword) => {
            try {
                const decryptedPassword = jwt.verify(encryptedPassword, process.env.JWT_SECRET);
                return decryptedPassword === password;
            } catch (err) {
                console.error("Failed to decrypt password:", err.message);
                return false; // Ignore invalid tokens
            }
        });

        if (isPasswordValid) {
            // Fetch gallery images and render the page
            const Photo_Gallaries_images = await Photo_Gallary_images.findOne({ _id: id }).lean();
            const First_Image = Photo_Gallaries_images.images[0]
            const all_images = Photo_Gallaries_images.images.slice(1);  // All remaining images excluding the first one
            const Photo_Gallariess = await Photo_Gallaries.find({}).lean();

            return res.render('Pages/Gallery', { Photo_Gallariess, Photo_Gallaries_images, First_Image, all_images });
        } else {
            return res.status(204).send()
        }
    } catch (error) {
        console.error(error);
        res.status(500).render("Pages/404", { error });
    }
};
