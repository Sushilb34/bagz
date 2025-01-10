const userModel = require ('../models/user-model');
const bcrypt = require ('bcrypt');
const crypto = require('crypto');
const { generateToken } = require('../utils/generateToken');
const nodemailer = require('nodemailer');

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

module.exports.forgotpasswordGet = (req,res) => {
    const messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    res.render('forgot-password', {messages});
};

module.exports.forgotpasswordPost = async (req,res) => {
    try {
        const {email} = req.body;
        const user = await userModel.findOne({email: email});
        if (!user) {
            req.flash('error', 'User not found please register');
            return res.redirect('/forgot-password');
        }
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const receiver = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                <p>Please click on the following link, or paste this into your browser to generate a new password:</p>
                <a href="http://${req.headers.host}/users/reset-password/${resetToken}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            `,
        };

        await transporter.sendMail(receiver);

        req.flash('success', 'A reset link has been sent.');
        res.redirect('/users/forgot-password');

    } catch (error) {
        console.error('Forgot password error:', error);
        req.flash('error', 'An error occurred. Please try again later.');
        res.redirect('/users/forgot-password');
    }
}

module.exports.resetpasswordGet = async (req, res) => {
    try {
        const user = await userModel.findOne({
            resetToken: req.params.token,
            resetTokenExpiration: { $gt: Date.now() }, 
        });
        if (!user) {
            req.flash('error', 'Invalid or expired reset token.');
            return res.redirect('/users/forgot-password');
        }
        const messages = { 
            error: req.flash('error'),
            success: req.flash('success')
        };

        res.render('reset-password', { token: req.params.token,messages: messages});
    } catch (error) {
        console.error("Error in resetPasswordGet:", error);
        req.flash('error', 'An error occurred. Please try again.');
        res.redirect('/users/forgot-password');
    }
};


module.exports.resetpasswordPost = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const user = await userModel.findOne({
            resetToken: req.params.token,
            resetTokenExpiration: { $gt: Date.now() },
        });

        if (!user) {
            req.flash('error', 'Invalid or expired reset token.');
            return res.redirect('/users/forgot-password');
        }

        if (newPassword !== confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect(`/users/reset-password/${req.params.token}`);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = undefined; // Clear the token
        user.resetTokenExpiration = undefined; // Clear the expiration
        await user.save();

        req.flash('success', 'Password reset successfully. Please log in.');
        res.redirect('/');
    } catch (error) {
        console.error("Error in resetPasswordPost:", error);
        req.flash('error', 'An error occurred during password reset.');
        res.redirect(`/users/reset-password/${req.params.token}`); // Redirect back to reset form
    }
};

module.exports.logout = (req,res) =>{
    res.cookie("token", "");
    res.redirect('/');
};
