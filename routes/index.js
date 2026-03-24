const authRoute = require('./auth');
const projectRoute = require('./project');
const bidRoute = require('./bid');
const contractRoute = require('./contract');
const milestoneRoute = require('./milestone');
const userRoute = require('./user');
const profileRoute = require('./profile');
const notficationRoute = require('./notification');
const adminRoute = require('./admin');

module.exports = (app) => {
    app.use('/Api/v1/auth', authRoute);
    app.use('/Api/v1/projects', projectRoute);
    app.use('/Api/v1/bids', bidRoute);
    app.use('/Api/v1/contracts', contractRoute);
    app.use('/Api/v1/milestones', milestoneRoute);
    app.use('/Api/v1/users', userRoute);
    app.use('/Api/v1/profiles', profileRoute);
    app.use('/Api/v1/notifications', notficationRoute);
    app.use('/Api/v1/admin', adminRoute);
}
