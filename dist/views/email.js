"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const handlebars_1 = __importDefault(require("handlebars"));
const path_1 = __importDefault(require("path"));
const renderTemplate = (templateName, data) => {
    const filePath = path_1.default.join(__dirname, `./templates/${templateName}.hbs`);
    const source = fs_1.default.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars_1.default.compile(source);
    return template(data);
};
exports.default = renderTemplate;
