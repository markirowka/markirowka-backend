import app from "../app";
import * as EditUser from "../controllers/userEditController";
import * as Files from "../controllers/fileController";
import * as History from "../controllers/historyController";
import * as Menu from "../controllers/menuController";
import * as Content from "../controllers/contentController";

export function initAdminRoutes() {
  app.post("/api/edituser", EditUser.EditUserParamByUser);

  app.post("/api/admin/edituser", EditUser.EditUserParamsByAdmin);

  app.get("/api/admin/allusers", EditUser.GetUsers);

  app.get("/api/admin/allusers/:offset/:limit", EditUser.GetUsers);

  app.get("/api/admin/alluserscount", EditUser.GetUsersCount);

  app.get("/api/external/validateunp/:unp", EditUser.unpValidationController);

  app.get("/api/admin/ordercount", History.GetOrderCount);

  app.get("/api/admin/allorders/:page", History.GetTotalOrderHistory);

  app.post("/api/deletefile", Files.DeleteFile);

  app.post("/api/updateorders", History.OrderStatusUpdater);

  app.delete("/api/admin/deleteuser/:id", EditUser.DeleteUserByAdmin);

  // Menu admin

  app.post("/api/admin/addmenu", Menu.CreateMenuItems);

  app.post("/api/admin/updatemenu", Menu.UpdateMenuItems);

  app.post("/api/admin/deletemenu", Menu.DeleteMenuItems);

  // Content admin

  app.post("/api/admin/setcontent", Content.SetContent);

  app.post("/api/admin/deletecontent", Content.DeletePage);

  app.get("/api/content/:url", Content.GetPage);

  app.get("/api/categories", Content.getCategoriesController);

  app.post("/api/addcategory", Content.addCategoryController);

  app.post("/api/deletecategory", Content.dropCategoryController);

  // News

  app.get("/api/getcontentblocks/:url", Content.getPageContentBlocks);

  app.post("/api/contentblock/create", Content.createPageContentBlock);

  app.post("/api/contentblock/update", Content.updatePageContentBlock);

  app.post("/api/contentblock/delete", Content.deletePageContentBlock);
}
