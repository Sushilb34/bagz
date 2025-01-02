const express = require ('express');
const router = express.Router();
const upload = require('../config/multer-config');
const productModel = require('../models/product-model');

router.post('/create', upload.single('image'),async(req,res) => {
   try {let {name,price,discount,bgcolor,panelcolor,textcolor } = req.body;

   if (!req.file) { // Check if a file was actually uploaded
    return res.status(400).send("Please upload an image");
}

   let product = await productModel.create({
    image: req.file.buffer,
    name,
    price,
    discount,
    bgcolor,
    panelcolor,
    textcolor,
   });
   req.flash('success', 'Product created successfully');
   res.redirect('/owners/admin');
} catch (err) {
    res.send(err.message);
}
});

module.exports = router;