import dotenv from "dotenv";
import express, { Request, Response } from "express";
import session from 'express-session';
import https from "https";
import fs from 'fs';
import bodyParser from "body-parser";
import multer from "multer"
import { SetupHeadersGlobal } from "./controllers/indexController";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    }
  });

const upload = multer({ storage: storage }).single('file');


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
app.use(express.json({ limit: '256mb' }));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

export default app;