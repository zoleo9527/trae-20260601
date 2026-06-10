"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error('Error:', err.message);
    res.status(400).json({
        success: false,
        message: err.message
    });
}
