import app from "../app";
import * as Users from "../controllers/authController";
import * as History from "../controllers/historyController";
import * as Download from "../controllers/downloadController";
import * as Recover from '../controllers/recoverController';

export function initUserRoutes() {
  app.get("/api/userordercount", History.GetOrderCountPerUser);

  app.post("/api/signupconfirm", Users.verifyEmail);

  app.get("/api/logout", Users.logout);

  app.get("/api/orderhistory/:page", History.GetOrderHistory);

  app.get("/api/downloads", Download.GetUserDownloadList);

  app.post("/api/resetpassword", Recover.RequestToRecoverPassword);

  app.post("/api/setnewpassword", Recover.SetupNewPassword);
}
