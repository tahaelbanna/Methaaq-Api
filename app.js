/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
require('./config/passport');

const ApiError = require('./utils/ApiError');
const globalErrorHandling = require('./middleware/GlobalErorr');
const mountRoutes = require('./routes/index');

const app = express();
app.use(cookieParser());
app.use(cors());
app.options(/(\/.*)/, cors());
app.use(compression());
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'uploads')));
app.set('query parser', 'extended');
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}
app.use((req, res, next) => {
    Object.defineProperty(req, 'query', {
        value: req.query,
        writable: true,
        configurable: true,
        enumerable: true,
    });
    next();
});
app.use(mongoSanitize());
app.use(xss());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { error: 'Too many requests, please try again later.' },
});

app.use('/Api', limiter);

app.use(passport.initialize());

mountRoutes(app);

app.all(/(\/.*)/, (req, res, next) => {
    next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

app.use(globalErrorHandling);


module.exports = app;
