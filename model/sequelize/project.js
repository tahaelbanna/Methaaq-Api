/* eslint-disable import/no-extraneous-dependencies */
const Sequelize = require('sequelize');
const sequelize = require('../../config/seqeulize-dataBase');
const slugify = require('slugify');

const Project = sequelize.define(
    'project',
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        slug: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        budget: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
        },
        deadline: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        status: {
            type: Sequelize.ENUM(
                'open',
                'in_progress',
                'completed',
                'cancelled'
            ),
            defaultValue: 'open',
        },
        clientId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
    },
    {
        hooks: {
            beforeCreate: async (project) => {
                if (project.title) {
                    project.slug = slugify(project.title, { lower: true, strict: true });
                }
            },
            beforeUpdate: async (project) => {
                if (project.changed('title')) {
                    project.slug = slugify(project.title, { lower: true, strict: true });
                }
            },
        },
    }
);

module.exports = Project;
