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
module.exports.changepasswordGet =  (req,res) => {
    const messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    res.render("change-password",{ messages});
    };

module.exports.changepasswordPost = async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
    
            if (newPassword !== confirmPassword) {
                req.flash('error', 'Passwords do not match.');
                return res.redirect('/users/change-password');
            }
    
            const user = await userModel.findById(req.user._id);
            if (!user) {
                req.flash('error', 'User not found.');
                return res.redirect('/users/change-password');
            }
    
            const passwordMatch = await bcrypt.compare(currentPassword, user.password);
            if (!passwordMatch) {
                req.flash('error', 'Incorrect current password.');
                return res.redirect('/users/change-password');
            }
    
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();
    
            req.flash('success', 'Password changed successfully!');
            res.redirect('/users/myaccount');
        } catch (error) {
            req.flash('error', 'An error occurred while changing the password.');
            res.redirect('/users/change-password');
        }
    };


module.exports.logout = (req,res) =>{
    res.cookie("token", "");
    res.redirect('/');
};
