import { Request, Response } from "express";
import "express-session";
import archiver from 'archiver';
import { GetAuthorizedUserData, IsAdmin, getUserIdFromAuth } from "./authController";
import {
  CheckAndCreateOwnerFolder,
  createFileName,
  CreateFileNameDBNote,
  deleteFile,
  GetDownloads,
  GetUserById,
  ItemDataClothes,
  ItemDataShoes,
  PaymentDocumentData,
  rootFolder,
} from "../models";
import { deleteFiles, GeneratePaymentPDF, generateZipArchive } from "../views/paymentDocs";
import { writeOrder } from "../models/orderHistory";
import { GenerateSpecifyShoes } from "../views/specifyShoes";
import { GenerateSpecifyClothes } from "../views/specifyClothes";
import { GenerateSpecifyOrder } from "../views/specifyOrder";
import sendEmail from "./emailController";
import { orderSendTo } from "../config";
import { checkDateDiapasone, filterDates, getClosestDate, getMonthName } from "../utils";

const sendTo = orderSendTo;

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

  const user = await GetUserById(userId);

  if (!user) {
    res.status(400).send({ error: "User not found" });
    return;
  }
  const dates = itemList.map((item) => {
    return {date: item.date}
  });

  const filteredDates = filterDates(dates);
  const closestDate = getClosestDate(filteredDates);
  const isDateValid = !closestDate || checkDateDiapasone(closestDate);

  if (!isDateValid) {
    res.status(400).send({ error: "Invalid order date" });
    return;    
  }

  try {
    await CheckAndCreateOwnerFolder(userId);
    const orderFile = createFileName(userId, "specify");
    const archiveName = await CreateFileNameDBNote(userId, "zip");
    const docId = archiveName.id;
    const filePathsToSend: string[] = [];
    await GenerateSpecifyOrder(userId, orderFile, itemList);
    const filePaths: string[] = (await Promise.all([
      GeneratePaymentPDF(user, createFileName(userId, "t12"), itemList, "t12", docId, closestDate),
      GeneratePaymentPDF(user, createFileName(userId, "invoice"), itemList, "invoice", docId, closestDate),
      GeneratePaymentPDF(user, createFileName(userId, "agreement"), itemList, "agreement", docId, closestDate),
      GeneratePaymentPDF(user, createFileName(userId, "cmr"), itemList, "cmr", docId, closestDate),
      GeneratePaymentPDF(user, createFileName(userId, "specification"), itemList, "specification", docId, closestDate)
    ])).map((item: { path: string}) => {
        return item.path
    });

    await generateZipArchive(user, archiveName.name, filePaths);

    const archiveNameUnsigned = await CreateFileNameDBNote(userId, "zip", false);

    const filePathsUnsigned: string[] = (await Promise.all([
      GeneratePaymentPDF(user, createFileName(userId, "t12", undefined, false), itemList, "t12", docId, closestDate, false),
      GeneratePaymentPDF(user, createFileName(userId, "invoice", undefined, false), itemList, "invoice", docId, closestDate, false),
      GeneratePaymentPDF(user, createFileName(userId, "agreement", undefined, false), itemList, "agreement", docId, closestDate, false),
      GeneratePaymentPDF(user, createFileName(userId, "cmr", undefined, false), itemList, "cmr", docId, closestDate, false),
      GeneratePaymentPDF(user, createFileName(userId, "specification", undefined, false), itemList, "specification", docId, closestDate, false)
    ])).map((item: { path: string}) => {
        return item.path
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

    if (clothesSpecify) {
      const fileDt = await CreateFileNameDBNote(userId, "specify");
      const file = await GenerateSpecifyClothes(userId, fileDt.name, clothesSpecify);
      if (file)
      filePathsToSend.push(file);
    }

    if (shoesSpecify) {
      const fileDt = await CreateFileNameDBNote(userId, "specify");
      const file = await GenerateSpecifyClothes(userId, fileDt.name, shoesSpecify);
      if (file)
      filePathsToSend.push(file);
    }
    
    if (user && sendTo && orderFile) {
      sendEmail(sendTo, "Заявка с сайта: заказ", "orderEmail", {...user, date, docId, closestDate}, filePathsToSend);
      setTimeout(() => {
        try {
          deleteFiles(filePathsToSend);
        } catch (e) {
          console.error(e);
        }
      }, 15000)
    }

    await writeOrder([archiveName.id], userId);
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
  const fileDt = await CreateFileNameDBNote(userId, "specify");
  const file = await GenerateSpecifyShoes(userId, fileDt.name, itemList);
  const user = await GetUserById(userId);
  await writeOrder ([fileDt.id], userId)

  if (user && sendTo && file) {
    console.log("Sending order file: ")
    sendEmail(sendTo, "Заявка с сайта: обувь", "orderEmail", {...user}, [file])
  }

  res.status(200).send({ fieId: fileDt.id, filename: fileDt.name, message: `File created for ${userId}` });
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
  const fileDt = await CreateFileNameDBNote(userId, "specify");
  const file = await GenerateSpecifyClothes(userId, fileDt.name, itemList);
  const user = await GetUserById(userId);
  await writeOrder ([fileDt.id], userId);

  console.log("Data to send: ", file, user, sendTo)

  if (user && sendTo && file) {
    console.log("Sending order file: ")
    sendEmail(sendTo, "Заявка с сайта: одежда", "orderEmail", {...user}, [file])
  }

  res.status(200).send({ fieId: fileDt.id, filename: fileDt.name, message: `File created for ${userId}` });
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
    deleteFile (file).then(() => {
       res.status(200).send({
        success: true,
        maessage: "File successfully deleted"
       });
       resolve(true);
    }).catch((e) => {
      res.status(500).send({
        maessage: e
       })
    });
    resolve(false);
  })

  
}
