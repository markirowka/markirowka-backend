import https from "https";
import fs from 'fs';
import app from "./app";
import { initRoutes } from "./routes";

const port = process.env.HTTP_PORT;

initRoutes();

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
  




