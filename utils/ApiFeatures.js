const { Op } = require('sequelize');

class ApiFeatures {
    constructor(queryString, initialOptions = {}) {
        this.queryString = queryString;
        this.queryOptions = {
            where: {},
            ...initialOptions,
        };
    }
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword'];
        excludedFields.forEach((el) => delete queryObj[el]);
        const finalWhere = {};
        for (const key in queryObj) {
            if (typeof queryObj[key] === 'object') {
                finalWhere[key] = {};
                for (const operator in queryObj[key]) {
                    if (
                        ['gte', 'gt', 'lte', 'lt', 'eq', 'ne'].includes(
                            operator
                        )
                    ) {
                        finalWhere[key][Op[operator]] = queryObj[key][operator];
                    }
                }
            } else {
                finalWhere[key] = queryObj[key];
            }
        }
        this.queryOptions.where = { ...this.queryOptions.where, ...finalWhere };
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').map((field) => {
                if (field.startsWith('-')) {
                    return [field.substring(1), 'DESC'];
                }
                return [field, 'ASC'];
            });
            this.queryOptions.order = sortBy;
        } else {
            this.queryOptions.order = [['createdAt', 'DESC']];
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',');
            this.queryOptions.attributes = fields;
        }
        return this;
    }
    search(searchFieldsArray) {
        if (this.queryString.keyword) {
            const keyword = this.queryString.keyword;
            const searchConditions = searchFieldsArray.map((field) => ({
                [field]: { [Op.iLike]: `%${keyword}%` },
            }));
            this.queryOptions.where = {
                ...this.queryOptions.where,
                [Op.or]: searchConditions,
            };
        }
        return this;
    }
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 50;
        const offset = (page - 1) * limit;
        this.queryOptions.limit = limit;
        this.queryOptions.offset = offset;
        this.page = page;
        this.limit = limit;
        return this;
    }

    calcPaginationResult(totalCount) {
        const pagination = {};
        pagination.currentPage = this.page;
        pagination.limit = this.limit;
        pagination.numberOfPages = Math.ceil(totalCount / this.limit);
        if (this.page * this.limit < totalCount) {
            pagination.next = this.page + 1;
        }
        if ((this.page - 1) * this.limit > 0) {
            pagination.previous = this.page - 1;
        }
        return pagination;
    }
}

module.exports = ApiFeatures;
