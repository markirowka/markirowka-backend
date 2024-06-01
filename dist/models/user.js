"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserById = exports.GetUsersByParam = void 0;
const db_1 = __importDefault(require("./db"));
function GetUsersByParam(param, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `SELECT * FROM "app_users" WHERE "${param}" = ${value};`;
        try {
            const result = yield db_1.default.query(query);
            return result.rows;
        }
        catch (e) {
            console.log(e.message);
            return [];
        }
    });
}
exports.GetUsersByParam = GetUsersByParam;
function GetUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `SELECT * FROM "app_users" WHERE "id" = ${id} LIMIT 1;`;
        try {
            const result = yield db_1.default.query(query);
            if (result.rows.length > 0) {
                return result.rows[0];
            }
            return null;
        }
        catch (e) {
            console.log(e.message);
            return null;
        }
    });
}
exports.GetUserById = GetUserById;
