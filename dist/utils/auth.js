"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateJWTToken = exports.GenerateAuthConfirmToken = exports.GeneratePasswordHash = exports.IsValidEmail = void 0;
const crypto_1 = require("crypto");
function IsValidEmail(email) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
}
exports.IsValidEmail = IsValidEmail;
function GeneratePasswordHash(password) {
    return (0, crypto_1.createHash)('sha256').update(password).digest('hex');
}
exports.GeneratePasswordHash = GeneratePasswordHash;
function GenerateAuthConfirmToken(data) {
}
exports.GenerateAuthConfirmToken = GenerateAuthConfirmToken;
function ValidateJWTToken(data) {
}
exports.ValidateJWTToken = ValidateJWTToken;
