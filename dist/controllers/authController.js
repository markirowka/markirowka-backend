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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverPassword = exports.verifyEmail = exports.signin = exports.signup = exports.GetAuthorizedUserData = exports.UserIdFromAuth = exports.IsAuthCheck = void 0;
require("express-session");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../models/db"));
const user_1 = require("../models/user");
const utils_1 = require("../utils");
const emailController_1 = __importDefault(require("./emailController"));
if (!process.env.JWT_SECRET_KEY) {
    throw new Error("Auth key is not defined");
}
const authPrivateKey = String(process.env.JWT_SECRET_KEY);
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, full_name, ceo, ceo_full, ceo_genitive, law_address, inn, cargo_recevier, cargo_city, user_role, } = req.body;
    if (!email) {
        res.status(400).send({ success: false, error: "Email is missed" });
        return;
    }
    if (!inn) {
        res.status(400).send({ success: false, error: "Inn is missed" });
        return;
    }
    if (!password) {
        res.status(400).send({ success: false, error: "Password is missed" });
        return;
    }
    if (!(0, utils_1.IsValidEmail)(email)) {
        res.status(400).send({ success: false, error: "Email is invalid" });
        return;
    }
    const ExistUser = yield (0, user_1.GetUsersByParam)("inn", inn);
    if (ExistUser.length > 0) {
        res.status(400).send({ success: false, error: "User is already exists" });
        return;
    }
    try {
        const password_hash = yield bcryptjs_1.default.hash(password, 10);
        const result = yield db_1.default.query(`INSERT INTO app_users 
      ( email,
        password_hash,
        full_name,
        ceo,
        ceo_full,
        ceo_genitive,
        law_address,
        inn,
        cargo_recevier,
        cargo_city,
        isconfirmed,
        user_role ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`, [email,
            password_hash,
            full_name || "",
            ceo || "",
            ceo_full || "",
            ceo_genitive || "",
            law_address || "",
            inn,
            cargo_recevier || "",
            cargo_city || "",
            false,
            "USER"]);
        const user = result.rows[0];
        const userId = user.id;
        // Send verification email logic here
        const token = jsonwebtoken_1.default.sign({ userId }, authPrivateKey, {
            expiresIn: "1d",
        });
        console.log("Verify token: ", token);
        const protocol = process.env.HTTP_PROTOCOL;
        const host = process.env.HTTP_HOST;
        const port = process.env.HTTP_PORT;
        const emailVerifyLink = `${protocol}://${host}:${port}/api/signupconfirm?token=${token}`;
        console.log(emailVerifyLink);
        (0, emailController_1.default)(user.email, "Sign up verification", "verifyEmail", {
            link: emailVerifyLink,
            user: user.full_name || user.inn
        });
        res
            .status(200)
            .json({ message: "User created", id: userId, email: user.email });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.signup = signup;
const signin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const result = yield db_1.default.query("SELECT * FROM app_users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid email or password" });
        }
        const user = result.rows[0];
        if (!user || !user.password_hash) {
            return res
                .status(400)
                .json({ success: false, error: "User not found" });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid email or password" });
        }
        const userId = user.id;
        const token = jsonwebtoken_1.default.sign({ userId }, authPrivateKey, {
            expiresIn: "1d",
        });
        req.session.token = token;
        res.json({ token, userId });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.signin = signin;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Params: ", req.params, "Query: ", req.query);
    const token = req.query.token;
    if (!token) {
        res.status(400).json({ error: "Token is missed" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(String(token), authPrivateKey);
        const userId = decoded.userId;
        yield db_1.default.query("UPDATE app_users SET isConfirmed = $1 WHERE id = $2", [
            true,
            userId,
        ]);
        res.json({ message: "Email verified successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.verifyEmail = verifyEmail;
const recoverPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const result = yield db_1.default.query("SELECT * FROM app_users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: "User not found" });
        }
        const user = result.rows[0];
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, authPrivateKey, {
            expiresIn: "1h",
        });
        // Send password reset email logic here
        res.json({ message: "Password reset email sent" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.recoverPassword = recoverPassword;
function IsAuthCheck(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = req.session.token;
        console.log("Sign in token: ", token);
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, authPrivateKey);
            console.log(decoded);
            res.status(200).json({ success: true });
        }
        catch (error) {
            console.error('Error verifying token:', error);
            res.status(401).json({ error: 'Unauthorized' });
        }
    });
}
exports.IsAuthCheck = IsAuthCheck;
function UserIdFromAuth(req) {
    const token = req.session.token;
    console.log("Sign in token: ", token);
    if (!token) {
        return null;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, authPrivateKey);
        console.log(decoded);
        if (typeof decoded === "string")
            return null;
        return decoded.userId;
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}
exports.UserIdFromAuth = UserIdFromAuth;
const GetAuthorizedUserData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.session.token;
    console.log("Sign in token: ", token);
    if (!token) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, authPrivateKey);
        console.log(decoded);
        if (typeof decoded === "string") {
            res.status(401).send({ error: 'Unauthorized' });
            return;
        }
        const userData = yield (0, user_1.GetUserById)(Number(decoded.userId));
        if (!userData) {
            res.status(400).send({ error: 'Invalid user' });
            return;
        }
        const { password_hash } = userData, dataToDisplay = __rest(userData, ["password_hash"]);
        res.status(200).send({
            data: dataToDisplay
        });
        return decoded.userId;
    }
    catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).send({ error: 'Unauthorized' });
    }
});
exports.GetAuthorizedUserData = GetAuthorizedUserData;
