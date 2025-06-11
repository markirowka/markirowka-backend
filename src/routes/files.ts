import multer from "multer";
import app from "../app";
import * as Files from "../controllers/fileController";
import * as Download from "../controllers/downloadController";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).single("file");

export function initFileRoutes() {
  app.get("/api/downloadinfo/:id", Download.getFileById);

  app.get("/api/file/:id/:filename", Download.DownloadFileByOwner);

  app.get("/api/files/deleteold/:days", Files.deleteOldFilesController);

  app.post("/api/createpayments", Files.CreatePaymentFiles);

  app.post("/api/createSpecify/shoes", Files.CreateSpecifyShoes);

  app.post("/api/createSpecify/clothes", Files.CreateSpecifyClothes);

  app.post("/api/video/upload", upload, Files.uploadFreeVideoController);

  app.get("/api/file/free/:filename", Files.downloadFreeVideoController);
}
