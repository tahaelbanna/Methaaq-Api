const Sequelize = require('sequelize');
const sequelize = require('../../config/seqeulize-dataBase');

const ContractMilestone = sequelize.define('contract_milestone', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    contractId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'contracts',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    order: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM(
            'pending',
            'funded',
            'submitted',
            'approved',
            'disApproved',
            'paid'
        ),
        defaultValue: 'pending',
    },
    dueDate: {
        type: Sequelize.DATE,
    },
});

module.exports = ContractMilestone;
