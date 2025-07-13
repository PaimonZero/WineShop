const express = require('express');
const multer = require('multer');
require('module-alias/register');
const qs = require('qs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dbConnect = require('@src/config/dbconnect');
const env = require('@src/config/environment');
const initRoutes = require('@src/routes/indexRoutes');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
// Passport.js configuration
require('@src/config/passport');

const app = express();
const port = env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Ghi đè query parser mặc định của Express để parse query strings phức tạp
app.set('query parser', (str) => qs.parse(str));

// Passport.js setup
app.use(session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Chỉ nên đặt secure: true nếu sử dụng HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// EJS setup with layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'src/views'));
app.set('layout', 'layouts/main'); // Default layout

// Database connect
dbConnect();

// Handle routes
initRoutes(app);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});
