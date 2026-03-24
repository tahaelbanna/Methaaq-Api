const User = require('./sequelize/user');
const Project = require('./sequelize/project');
const Bid = require('./sequelize/bid');
const Contract = require('./sequelize/contract');
const BidMilestone = require('./sequelize/bidMilestone');
const contractMilestone = require('./sequelize/contractMilestone');

// between user & project
User.hasMany(Project, {
    foreignKey: 'clientId',
    as: 'projects',
});

Project.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

// between user & Bid
User.hasMany(Bid, {
    foreignKey: 'freelancerId',
    as: 'bids',
});

Bid.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

// between Bid & project
Project.hasMany(Bid, {
    foreignKey: 'projectId',
    as: 'bids',
});

Bid.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// between client $ contract
User.hasMany(Contract, {
    foreignKey: 'clientId',
    as: 'clientContract',
});

Contract.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

//  between freelancer $ contract
User.hasMany(Contract, {
    foreignKey: 'freelancerId',
    as: 'freelancerContract',
});

Contract.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

// between project $ contract
Project.hasOne(Contract, {
    foreignKey: 'projectId',
    as: 'contract',
});

Contract.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// between bid $ contract
Bid.hasOne(Contract, {
    foreignKey: 'bidId',
    as: 'contract',
});

Contract.belongsTo(Bid, { foreignKey: 'bidId', as: 'bid' });

// between bid $ BidMilestone
Bid.hasMany(BidMilestone, { 
    foreignKey: 'bidId', 
    as: 'milestones' 
});
BidMilestone.belongsTo(Bid, { foreignKey: 'bidId', as: 'bid' });

// between bid $ contractMilestone
Contract.hasMany(contractMilestone, { 
    foreignKey: 'contractId', 
    as: 'milestones' 
});
contractMilestone.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
