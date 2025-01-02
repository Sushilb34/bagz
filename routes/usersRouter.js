const express = require ('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const {registerUser,
        loginUser,
        logout,
        } = require("../controllers/authController");

router.get('/', (req,res) => {
    res.send("hello users router");
});

router.post('/register', registerUser);

router.post('/login',loginUser)

router.get('/logout', logout)

router.get('/logout',logout)

module.exports = router;
