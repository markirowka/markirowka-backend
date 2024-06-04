import dotenv from "dotenv";
import express, { Request, Response } from "express";
import session from 'express-session';
import bodyParser from "body-parser";
import * as Users from "./controllers/authController";
import * as EditUser from "./controllers/userEditController";
import * as Download from "./controllers/downloadController";
import * as Files from "./controllers/fileController";

dotenv.config();
const app = express();
const port = process.env.HTTP_PORT;

if (!process.env.JWT_SECRET_KEY) {
    throw new Error("Auth key is not defined");
  }
  
const authPrivateKey = String(process.env.JWT_SECRET_KEY);

app.use(session({
    secret: authPrivateKey, // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
  }));


app.use(express.json());

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

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

app.get ("/api/downloads", Download.GetUserDownloadList);

app.get ("/api/file/:id/:filename", Download.DownloadFileByOwner);

app.post("/api/resetpassword", Users.recoverPassword);

app.post ("/api/createT12", Files.CreateT12);

app.post ("/api/createSpecify", Files.CreateSpecify);

app.post ("/api/edituser", EditUser.EditUserParamByUser);

app.post ("/api/edituser", EditUser.EditUserParamByUser);

app.post ("/api/admin/edituser", EditUser.EditUserParamsByAdmin);

app.delete ("/api/admin/deleteuser/:id", EditUser.DeleteUserByAdmin);

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
  });
  




