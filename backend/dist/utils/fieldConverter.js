"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFields = exports.convertToCamelCase = void 0;
const toCamelCase = (str) => {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};
const convertToCamelCase = (obj) => {
    if (!obj || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj)) {
        return obj.map((item) => (0, exports.convertToCamelCase)(item));
    }
    const result = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const camelKey = toCamelCase(key);
            result[camelKey] = (0, exports.convertToCamelCase)(obj[key]);
        }
    }
    return result;
};
exports.convertToCamelCase = convertToCamelCase;
exports.convertFields = {
    project: (row) => ({
        ...(0, exports.convertToCamelCase)(row),
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
    }),
    arrangement: (row) => ({
        ...(0, exports.convertToCamelCase)(row),
        expertIds: row.expert_ids ? JSON.parse(row.expert_ids) : [],
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
    }),
    signinRecord: (row) => ({
        ...(0, exports.convertToCamelCase)(row),
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
    }),
    exception: (row) => ({
        ...(0, exports.convertToCamelCase)(row),
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
    }),
    operationLog: (row) => ({
        ...(0, exports.convertToCamelCase)(row),
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
    }),
    user: (row) => ({
        ...(0, exports.convertToCamelCase)(row),
    }),
    expert: (row) => ({
        ...(0, exports.convertToCamelCase)(row),
        expertise: row.expertise ? JSON.parse(row.expertise) : [],
    }),
};
//# sourceMappingURL=fieldConverter.js.map