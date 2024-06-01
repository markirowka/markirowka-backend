"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const Users = __importStar(require("./controllers/authController"));
const Files = __importStar(require("./controllers/fileController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.HTTP_PORT;
if (!process.env.JWT_SECRET_KEY) {
    throw new Error("Auth key is not defined");
}
const authPrivateKey = String(process.env.JWT_SECRET_KEY);
app.use((0, express_session_1.default)({
    secret: authPrivateKey, // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({
    extended: true,
}));
app.get("/", (req, res) => {
    res.status(200).send("API homepage");
});
app.get("/api/filelist", (req, res) => {
    res.status(200).send("API homepage");
});
app.get("/api/file/create", (req, res) => {
    res.status(200).send("API homepage");
});
app.post("/api/signin", Users.signin);
app.post("/api/signup", Users.signup);
app.get("/api/signcheck", Users.IsAuthCheck);
app.get("/api/userdata", Users.GetAuthorizedUserData);
app.get("/api/signupconfirm", Users.verifyEmail);
app.post("/api/resetpassword", Users.recoverPassword);
app.get("/api/createT12", Files.CreateT12);
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
