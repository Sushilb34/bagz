const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");

router.get("/",(req,res,next) => {
    res.render("index", { 
       messages: {
        success:  req.flash('success'),
        error: req.flash('error')
    },
    loggedin: false
    });
});


router.get("/shop", isLoggedIn, async (req, res, next) => {
    try {
        const products = await productModel.find({}); // Fetch all products from the database
        if (!Array.isArray(products)) {
            console.error("Products is not an array:", products);
            return res.status(500).send("Error loading products.");
        }
        let success = req.flash('success');
        res.render("shop", {products: products,success});
    } catch (err) {
        console.error("Error fetching products:", err);
        next(err);
    }
});
router.get("/cart", isLoggedIn, async (req, res) => {
    let user = await userModel
    .findOne({email: req.user.email})
    .populate("cart");
    res.render("cart",{ user });
});
router.get("/addtocart/:productid", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    user.cart.push(req.params.productid);
    await user.save();
    req.flash('success', 'Product added to cart');
    res.redirect("/shop");
});



router.get("/logout", isLoggedIn ,(req,res) => {
    res.render("shop");
});

module.exports = router;