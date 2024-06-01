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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateT12 = void 0;
require("express-session");
const authController_1 = require("./authController");
const CreateT12 = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = (0, authController_1.UserIdFromAuth)(req);
    if (!userId) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
    }
    res.status(200).send({ message: `File created for ${userId}` });
});
exports.CreateT12 = CreateT12;
