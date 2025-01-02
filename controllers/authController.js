const userModel = require ('../models/user-model');
const bcrypt = require ('bcrypt');
const { generateToken } = require('../utils/generateToken');

module.exports.registerUser = async (req,res) => {
    try {
        let { email,password,fullname } = req.body;

    let user = await userModel.findOne({ email: email});
if (user) {
    req.flash('error', 'User with this email already exists.');
    return res.redirect('/');
}

        bcrypt.genSalt(10, async (err,salt) =>{
            bcrypt.hash(password, salt, async (err,hash) => {
                if(err) {
                    req.flash('error', 'Error during registration.');
                    return res.redirect('/');
                }
                 else {
                let user = await userModel.create({
                    email,
                    password: hash,
                    fullname,
                });
                let token = generateToken(user);
                res.cookie("token", token);
                req.flash('success', 'Registration successful!');
                res.redirect('/');
            }
        });
});
        } catch (err) {
            console.error(err);
            req.flash('error', 'Registration failed');
            res.redirect('/');
    }
};

module.exports.loginUser = async (req,res) => {
    try {
    let {email,password} = req.body;
    let user = await userModel.findOne({ email: email});
    if(!user) {
        req.flash('error', 'Invalid email');
        return res.redirect('/');
    }

    await bcrypt.compare(password, user.password,(err,result) =>{
        if(err) {
            console.error(err);
            req.flash('error', 'An error occurred during login.');
            return res.redirect('/');
        }
        if(!result) {
            req.flash('error', 'Invalid  password.');
            return res.redirect('/');
        }

        const token = generateToken(user);
        res.cookie("token", token)
        req.flash('success', 'Login successful!');
        res.redirect('/shop');
    });
    } catch (err) {
        console.error(err);
        req.flash('error', 'An error occurred during login.');
        res.redirect('/');
    }};


module.exports.logout = (req,res) =>{
    res.cookie("token", "");
    res.redirect('/');
};
