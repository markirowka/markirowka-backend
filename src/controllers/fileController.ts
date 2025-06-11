import { Request, Response } from "express";
import "express-session";
import fs from "fs";
import archiver from "archiver";
import {
  GetAuthorizedUserData,
  IsAdmin,
  getUserIdFromAuth,
} from "./authController";
import {
  CheckAndCreateOwnerFolder,
  CMRDeliveryData,
  createFileName,
  CreateFileNameDBNote,
  deleteFile,
  deleteOldFiles,
  GetDownloads,
  GetUserById,
  ItemDataClothes,
  ItemDataShoes,
  PaymentDocumentData,
  rootFolder,
} from "../models";
import {
  deleteFiles,
  GeneratePaymentPDF,
  generateZipArchive,
} from "../views/paymentDocs";
import { writeOrder } from "../models/orderHistory";
import { GenerateSpecifyShoes } from "../views/specifyShoes";
import { GenerateSpecifyClothes } from "../views/specifyClothes";
import { GenerateSpecifyOrder } from "../views/specifyOrder";
import sendEmail from "./emailController";
import { orderSendTo } from "../config";
import {
  checkDateDiapasone,
  filterDates,
  getClosestDate,
  getMonthName,
} from "../utils";

const sendTo = orderSendTo;
const frontendVideoPath = `/var/www/web/sites/${process.env.HTTP_HOST}/video`;

export const CreatePaymentFiles = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  const userId = getUserIdFromAuth(req);
  if (!userId) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  if (!req.body.items) {
    res.status(400).send({ error: "Request has no any items" });
  }

  const itemList: PaymentDocumentData[] = req.body.items;
  const cmr: CMRDeliveryData = req.body.cmr_data || {};
  const has_specify = !!(req.body.has_specify);

  const user = await GetUserById(userId);

  if (!user) {
    res.status(400).send({ error: "User not found" });
    return;
  }
  const dates = itemList.map((item) => {
    return { date: item.date };
  });
  // const categories: string[] = itemList.map((item) => item.category);
  const filteredDates = filterDates(dates);
  const closestDate = getClosestDate(filteredDates);
  console.log("Is from admin:", await IsAdmin({req}));
  if (!closestDate) {
    res.status(400).send({ error: "Not found any document date" });
    return;
  }
  const isDateValid = (await IsAdmin({req})) ||
    checkDateDiapasone(closestDate, has_specify);
  console.log("Validation result:", isDateValid, checkDateDiapasone(closestDate, has_specify));
  if (!isDateValid) {
    res.status(400).send({ error: "Invalid order date" });
    return;
  }
  let newDocsId = 0;
  try {
    await CheckAndCreateOwnerFolder(userId);
    const orderFile = createFileName(userId, "specify");
    const archiveName = await CreateFileNameDBNote(
      userId,
      "zip",
      0,
      true,
      true
    );
    const docId = archiveName.id;
    newDocsId = archiveName.id;
    const filePathsToSend: string[] = [];
    await GenerateSpecifyOrder(userId, orderFile, itemList);
    const filePaths: string[] = (
      await Promise.all([
        GeneratePaymentPDF(
          user,
          createFileName(userId, "t12"),
          itemList,
          cmr,
          "t12",
          docId,
          closestDate
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "invoice"),
          itemList,
          cmr,
          "invoice",
          docId,
          closestDate
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "invoicef"),
          itemList,
          cmr,
          "invoicef",
          docId,
          closestDate
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "agreement"),
          itemList,
          cmr,
          "agreement",
          docId,
          closestDate
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "cmr"),
          itemList,
          cmr,
          "cmr",
          docId,
          closestDate
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "specification"),
          itemList,
          cmr,
          "specification",
          docId,
          closestDate
        ),
      ])
    ).map((item: { path: string }) => {
      return item.path;
    });

    await generateZipArchive(user, archiveName.name, filePaths);

    const archiveNameUnsigned = await CreateFileNameDBNote(
      userId,
      "zip",
      newDocsId,
      false,
      false
    );

    const filePathsUnsigned: string[] = (
      await Promise.all([
        GeneratePaymentPDF(
          user,
          createFileName(userId, "t12", undefined, false),
          itemList,
          cmr,
          "t12",
          docId,
          closestDate,
          false
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "invoice", undefined, false),
          itemList,
          cmr,
          "invoice",
          docId,
          closestDate,
          false
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "invoicef", undefined, false),
          itemList,
          cmr,
          "invoicef",
          docId,
          closestDate,
          false
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "agreement", undefined, false),
          itemList,
          cmr,
          "agreement",
          docId,
          closestDate,
          false
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "cmr", undefined, false),
          itemList,
          cmr,
          "cmr",
          docId,
          closestDate,
          false
        ),
        GeneratePaymentPDF(
          user,
          createFileName(userId, "specification", undefined, false),
          itemList,
          cmr,
          "specification",
          docId,
          closestDate,
          false
        ),
      ])
    ).map((item: { path: string }) => {
      return item.path;
    });

    await generateZipArchive(user, archiveNameUnsigned.name, filePathsUnsigned);

    const dt = new Date();
    const dateDay = dt.getDate(); // День месяца
    const dateMonth = getMonthName(dt.getMonth()); // Название месяца
    const dateYear = dt.getFullYear();
    const date = `${dateDay}-${dateMonth}-${dateYear}`;

    filePathsToSend.push(`${rootFolder}${userId}/${orderFile}`);
    filePathsToSend.push(`${rootFolder}${userId}/${archiveNameUnsigned.name}`);

    const clothesSpecify: ItemDataClothes[] | undefined = req.body.clothes;
    const shoesSpecify: ItemDataShoes[] | undefined = req.body.shoes;

    if (clothesSpecify && clothesSpecify.length > 0) {
      const fileDt = await CreateFileNameDBNote(
        userId,
        "specify",
        newDocsId,
        true,
        false
      );
      const file = await GenerateSpecifyClothes(
        userId,
        fileDt.name,
        clothesSpecify
      );
      if (file) filePathsToSend.push(file);
    }

    if (shoesSpecify && shoesSpecify.length > 0) {
      const fileDt = await CreateFileNameDBNote(
        userId,
        "specify",
        newDocsId,
        true,
        false
      );
      const file = await GenerateSpecifyShoes(
        userId,
        fileDt.name,
        shoesSpecify
      );
      if (file) filePathsToSend.push(file);
    }

    if (user && sendTo && orderFile) {
      await sendEmail(
        sendTo,
        "Заявка с сайта: заказ",
        "orderEmail",
        { ...user, date, docId, closestDate },
        filePathsToSend
      );
      setTimeout(() => {
        try {
          deleteFiles(filePathsToSend);
        } catch (e) {
          console.error(e);
        }
      }, 15000);
    }
    const paidDateTimestamp = closestDate
      ? Math.round(new Date(closestDate).getTime() / 1000)
      : undefined;
    await writeOrder({
      documents: [{ id: archiveName.id }],
      user_id: userId,
      paid_date: paidDateTimestamp,
      status: "new",
      has_specify
    });
    /* 
    data: {
    documents: { id: number }[],
    user_id: number,
    paid_date?: number,
    status: string,
    has_specify?: boolean,
    date?: number
  }
    */
    res
      .status(200)
      .send({ message: `Files created for ${userId}`, files: [archiveName] });
  } catch (e: any) {
    console.error(e.message);
    res.status(500).send({ error: `File creation failed` });
    return;
  }
};

export const CreateSpecifyShoes = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  const userId = getUserIdFromAuth(req);
  if (!userId) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  if (!req.body.items) {
    res.status(400).send({ error: "Request has no any items" });
  }

  const itemList: ItemDataShoes[] = req.body.items;
  await CheckAndCreateOwnerFolder(userId);
  const filename = createFileName(userId, "specify", 0);
  const file = await GenerateSpecifyShoes(userId, filename, itemList);
  const user = await GetUserById(userId);
  // await writeOrder([fileDt.id], userId);

  if (user && sendTo && file) {
    console.log("Sending order file: ");
    sendEmail(sendTo, "Заявка с сайта: обувь", "orderEmail", { ...user }, [
      file,
    ]);
  }

  res.status(200).send({
    fieId: 0,
    filename: filename,
    message: `File created for ${userId}`,
  });
};

export const CreateSpecifyClothes = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  const userId = getUserIdFromAuth(req);
  if (!userId) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  if (!req.body.items) {
    res.status(400).send({ error: "Request has no any items" });
  }

  const itemList: ItemDataClothes[] = req.body.items;
  await CheckAndCreateOwnerFolder(userId);
  const filename = await CreateFileNameDBNote(
    userId,
    "specify",
    0,
    true,
    false
  );
  const file = createFileName(userId, "specify", 0);
  const user = await GetUserById(userId);
  // await writeOrder([fileDt.id], userId);

  console.log("Data to send: ", file, user, sendTo);

  if (user && sendTo && file) {
    console.log("Sending order file: ");
    sendEmail(sendTo, "Заявка с сайта: одежда", "orderEmail", { ...user }, [
      file,
    ]);
  }

  res.status(200).send({
    fieId: 0,
    filename: filename,
    message: `File created for ${userId}`,
  });
};

export const DeleteFile = async (req: Request, res: Response) => {
  const userId = getUserIdFromAuth(req);
  const isAdmin = IsAdmin({ req });
  if (!userId) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }
  const file = req.body?.fileId;
  if (!file) {
    res.status(400).send({ error: "File not specified" });
    return;
  }

  if (!isAdmin) {
    const filesByOwner = await GetDownloads(userId);
    const selectedFile = filesByOwner.find((file) => {
      return file.id === Number(file);
    });
    if (!selectedFile) {
      res.status(403).send({ error: "No rights to delete file" });
      return;
    }
  }

  return new Promise(async (resolve, reject) => {
    deleteFile(file)
      .then(() => {
        res.status(200).send({
          success: true,
          maessage: "File successfully deleted",
        });
        resolve(true);
      })
      .catch((e) => {
        res.status(500).send({
          maessage: e,
        });
      });
    resolve(false);
  });
};

export const deleteOldFilesController = async (req: Request, res: Response) => {
  const isFromAdmin = await IsAdmin({ req });
  if (!isFromAdmin) {
    res.status(403).send({ error: "No rigths to collaborate" });
    return;
  }

  const daysAgeLimit = req.params.days ? Number(req.params.days) : 30;

  const deletionCount = await deleteOldFiles(daysAgeLimit);

  res.status(200).send({
    deleted: deletionCount,
  });
};

export const uploadFreeVideoController = async (
  req: Request,
  res: Response
) => {
  const isFromAdmin = await IsAdmin({ req });
  if (!isFromAdmin) {
    return res.status(403).send({ error: "No rights to upload" });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).send({ error: "No file uploaded" });
  }

  const freeFolder = `${rootFolder}/free`;
  const fileName = file.originalname || "unnamed";
  const filePath = `${frontendVideoPath}/${fileName}`;

  fs.mkdir(freeFolder, { recursive: true }, (err) => {
    if (err) {
      console.error("Ошибка создания директории:", err);
      res.status(500).send({ error: "Failed to create directory" });
      return;
    }

    // После успешного создания директории – сохраняем файл
    fs.writeFile(filePath, file.buffer, (err) => {
      if (err) {
        console.error("Ошибка записи файла:", err);
        res.status(500).send({ error: "Failed to save file" });
        return;
      }

      res.status(200).send({ success: true, fileName });
    });
  });
};

export const downloadFreeVideoController = (req: Request, res: Response) => {
  const { filename } = req.params;
  if (!filename) {
    return res.status(404).send({ error: "No filename provided" });
  }

  const filePath = `${rootFolder}/free/${filename}`;

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send({ error: "File not found" });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Ошибка при отправке файла:", err);
        res.status(500).send({ error: "Failed to download file" });
      }
    });
  });
};
