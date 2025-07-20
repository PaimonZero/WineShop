const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('@models/User');
require('dotenv').config();

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => done(null, user));
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Tìm user theo googleId
                let user = await User.findOne({ googleId: profile.id });
                if (user) return done(null, user);

                // 2. Nếu không tìm thấy googleId, thử tìm theo email
                const existingUserByEmail = await User.findOne({ email: profile.emails[0].value });
                if (existingUserByEmail) {
                    // Nếu đã tồn tại email, liên kết thêm googleId
                    existingUserByEmail.googleId = profile.id;
                    await existingUserByEmail.save();
                    return done(null, existingUserByEmail);
                }

                // 3. Nếu email chưa tồn tại → tạo mới
                // Xử lý name một cách an toàn
                const name = profile.name || {};
                const firstName = name.givenName || profile.displayName?.split(' ')[0] || '';
                const lastName =
                    name.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';

                const newUser = await User.create({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    firstName,
                    lastName,
                    avatar: profile.photos?.[0]?.value || '',
                    password: Math.random().toString(36).slice(-8), // dùng cho validation
                });

                return done(null, newUser);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);
