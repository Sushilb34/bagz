const express = require ('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const userModel = require('../models/user-model');
const {registerUser,
        loginUser,
        logout,
        account,
        changepasswordGet,
        changepasswordPost,
        } = require("../controllers/authController");

router.get('/', (req,res) => {
    res.send("hello users router");
});

router.post('/register', registerUser);

router.post('/login',loginUser)

router.get('/myaccount', isLoggedIn, async (req, res) => {
    try {
        let { email,fullname } = req.body;
        const user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect("/");
        }
        res.render('myaccount', { user }); 
    } catch (error) {
        console.error("Error fetching user:", error);
        req.flash('error', 'An error occurred.');
        res.redirect("/");
    }
});

router.get('/change-password',isLoggedIn,changepasswordGet)
router.post('/change-password',isLoggedIn,changepasswordPost)

router.get('/logout', logout);

module.exports = router;