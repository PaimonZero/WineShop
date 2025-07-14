const User = require('@models/User');
const asyncHandler = require('express-async-handler');
const tokenUtils = require('@middlewares/jwt');

// Render users page
const renderUsersPage = asyncHandler(async (req, res) => {
    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : null;

    const users = await User.find().lean();
    if (users.length === 0) {
        return res.render('admin/users', {
            title: 'Manage Users',
            users: [],
            notification: { type: 'info', message: 'No users found.' },
            account: req.user || null,
        });
    }

    res.render('admin/users', {
        title: 'Manage Users',
        users,
        notification,
        account: req.user || null,
    });
});

// Add new user
const createUser = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, mobile } = req.body;
    if (!email || !password || !firstName || !lastName) {
        return res.redirect('/admin/users?type=danger&message=Please fill in all required fields!');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.redirect('/admin/users?type=danger&message=User already exists!');
    }

    // Check if mobile number already exists
    const mobileExists = await User.findOne({ mobile });
    if (mobile && mobileExists) {
        return res.redirect('/admin/users?type=danger&message=Phone number already in use!');
    }

    // Create new user
    const newUser = new User({
        email,
        password,
        firstName,
        lastName,
        mobile,
    });
    await newUser.save();

    // Redirect with success message
    return res.redirect('/admin/users?type=success&message=User created successfully!');
});

// Update user role and block status
const updateUserInAdminPage = asyncHandler(async (req, res) => {
    const { userId, role, isBlocked } = req.body;

    if (!userId) {
        return res.redirect('/admin/users?type=danger&message=User ID is required!');
    }
    const user = await User.findById(userId);
    if (!user) {
        return res.redirect('/admin/users?type=danger&message=User not found!');
    }
    // Update user role and block status
    user.role = role || user.role;
    user.isBlocked = isBlocked !== undefined ? isBlocked : user.isBlocked;
    await user.save();
    // Redirect with success message
    return res.redirect('/admin/users?type=success&message=User updated successfully!');
});

module.exports = {
    renderUsersPage,
    createUser,
    updateUserInAdminPage,
};