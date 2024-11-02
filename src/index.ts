import dotenv from "dotenv";
import express, { Request, Response } from "express";
import session from 'express-session';
import https from "https";
import fs from 'fs';
import bodyParser from "body-parser";
import * as Users from "./controllers/authController";
import * as EditUser from "./controllers/userEditController";
import * as Download from "./controllers/downloadController";
import * as Files from "./controllers/fileController";
import * as Recover from './controllers/recoverController';
import * as History from './controllers/historyController';
import * as Menu from './controllers/menuController';
import * as Content from './controllers/contentController';
import * as Stats from './controllers/statsController';
import { SetupHeadersGlobal } from "./controllers/indexController";

dotenv.config();
const app = express();
const port = process.env.HTTP_PORT;

if (!process.env.JWT_SECRET_KEY) {
    throw new Error("Auth key is not defined");
  }
  
const authPrivateKey = String(process.env.JWT_SECRET_KEY);

app.set('trust proxy', 1);

app.use(session({
    secret: authPrivateKey, // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,   // Ensure the cookie is only sent over HTTPS
      httpOnly: true, // Helps prevent cross-site scripting (XSS) attacks
      sameSite: 'strict' // Helps prevent cross-site request forgery (CSRF) attacks
    }
  }));

app.use(SetupHeadersGlobal);
app.use(express.json({ limit: '64mb' }));

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

app.get("/api/userordercount", History.GetOrderCountPerUser);

app.post("/api/signupconfirm", Users.verifyEmail);

app.get('/api/logout', Users.logout);

app.get('/api/menu', Menu.GetMenu);

app.get("/api/orderhistory/:page", History.GetOrderHistory);

app.get ("/api/downloads", Download.GetUserDownloadList);

app.get ("/api/downloadinfo/:id", Download.getFileById);

app.get ("/api/file/:id/:filename", Download.DownloadFileByOwner);

app.post("/api/resetpassword", Recover.RequestToRecoverPassword);

app.post("/api/setnewpassword", Recover.SetupNewPassword);

app.post ("/api/createpayments", Files.CreatePaymentFiles);

app.post ("/api/createSpecify/shoes", Files.CreateSpecifyShoes);

app.post ("/api/createSpecify/clothes", Files.CreateSpecifyClothes);

app.post ("/api/edituser", EditUser.EditUserParamByUser);

app.post ("/api/admin/edituser", EditUser.EditUserParamsByAdmin);

app.get ("/api/admin/allusers", EditUser.GetUsers);

app.get ("/api/admin/ordercount", History.GetOrderCount);

app.get ("/api/admin/allorders/:page", History.GetTotalOrderHistory);

app.post("/api/deletefile", Files.DeleteFile);

app.get ("/api/updateorders", History.OrderStatusUpdater);

app.delete ("/api/admin/deleteuser/:id", EditUser.DeleteUserByAdmin);

// Menu admin

app.post("/api/admin/addmenu", Menu.CreateMenuItems);

app.post("/api/admin/updatemenu", Menu.UpdateMenuItems);

app.post("/api/admin/deletemenu", Menu.DeleteMenuItems);

// Content admin

app.post("/api/admin/setcontent", Content.SetContent);

app.post("/api/admin/deletecontent", Content.DeletePage);

app.get("/api/content/:url", Content.GetPage);

// Stats

app.get("/api/stats/getreadstats", Stats.getUserReadStatsResponce);

app.get("/api/stats/markread/:url", Stats.setArticleRead);

// News

app.get("/api/getcontentblocks/:url", Content.getPageContentBlocks);

app.post("/api/contentblock/create", Content.createPageContentBlock);

app.post("/api/contentblock/update", Content.updatePageContentBlock);

app.post("/api/contentblock/delete", Content.deletePageContentBlock);

const https_options = {
  key: fs.readFileSync(process.env.HTTPS_PRIVATE_KEY_PATH || "../"),
  cert: fs.readFileSync(process.env.HTTPS_CERT_PATH || "../")
};

https.createServer(https_options, app).listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

/* app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
  }); */
  




