import app from "../app";
import * as Users from "../controllers/authController";
import * as Menu from '../controllers/menuController';
import * as Stats from '../controllers/statsController';

export function initCommonRoutes() {
  app.get("/", (req, res) => {
    res.status(200).send("API homepage");
  });

  app.get("/api/filelist", (req, res) => {
    res.status(200).send("API homepage");
  });

  app.get("/api/file/create", (req, res) => {
    res.status(200).send("API homepage");
  });

  app.get('/api/menu', Menu.GetMenu);

  app.post("/api/signin", Users.signin);

  app.post("/api/signup", Users.signup);

  app.get("/api/signcheck", Users.IsAuthCheck);

  app.get("/api/userdata", Users.GetAuthorizedUserData);

  
  // Stats
  
  app.get("/api/stats/getreadstats", Stats.getUserReadStatsResponce);
  
  app.get("/api/stats/markread/:url", Stats.setArticleRead);
  
}
