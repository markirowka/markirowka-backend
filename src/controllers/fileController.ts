import { Request, Response } from "express";
import "express-session";
import archiver from 'archiver';
import { GetAuthorizedUserData, IsAdmin, UserIdFromAuth } from "./authController";
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
import { WriteOrder } from "../models/orderHistory";
import { GenerateSpecifyShoes } from "../views/specifyShoes";
import { GenerateSpecifyClothes } from "../views/specifyClothes";
import { GenerateSpecifyOrder } from "../views/specifyOrder";
import sendEmail from "./emailController";
import { orderSendTo } from "../config";
import { getMonthName } from "../utils";

const sendTo = orderSendTo;

export const CreatePaymentFiles = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  const userId = UserIdFromAuth(req);
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

  try {
    await CheckAndCreateOwnerFolder(userId);
    const orderFile = createFileName(userId, "specify");
    const archiveName = await CreateFileNameDBNote(userId, "zip");
    
    await GenerateSpecifyOrder(userId, orderFile, itemList);
    const filePaths: string[] = (await Promise.all([
      GeneratePaymentPDF(user, createFileName(userId, "t12"), itemList, "t12", archiveName.id),
      GeneratePaymentPDF(user, createFileName(userId, "invoice"), itemList, "invoice", archiveName.id),
      GeneratePaymentPDF(user, createFileName(userId, "agreement"), itemList, "agreement", archiveName.id),
      GeneratePaymentPDF(user, createFileName(userId, "cmr"), itemList, "cmr", archiveName.id),
      GeneratePaymentPDF(user, createFileName(userId, "specification"), itemList, "specification", archiveName.id)
    ])).map((item: { path: string}) => {
        return item.path
    });

    await generateZipArchive(user, archiveName.name, filePaths)
    const dt = new Date();
    const dateDay = dt.getDate(); // День месяца
    const dateMonth = getMonthName(dt.getMonth()); // Название месяца
    const dateYear = dt.getFullYear();
    const date = `${dateDay}-${dateMonth}-${dateYear}`;
    
    if (user && sendTo && orderFile) {
      // console.log("Sending order file, attachment: ", `${rootFolder}${userId}/${orderFile}`);
      sendEmail(sendTo, "Заявка с сайта: заказ", "orderEmail", {...user, date}, [`${rootFolder}${userId}/${orderFile}`]);
      setTimeout(() => {
        try {
          deleteFiles([`${rootFolder}${userId}/${orderFile}`])
        } catch (e) {
          console.log(e);
        }
      }, 15000)
    }

    await WriteOrder([archiveName.id], userId);
    res
      .status(200)
      .send({ message: `Files created for ${userId}`, files: [archiveName] });
  } catch (e: any) {
    console.log(e.message);
    res.status(500).send({ error: `File creation failed` });
    return;
  }
};

export const CreateSpecifyShoes = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  const userId = UserIdFromAuth(req);
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
  await WriteOrder ([fileDt.id], userId)

  console.log("Data to send: ", file, user, sendTo)

  /* if (user && sendTo && file) {
    console.log("Sending order file: ")
    sendEmail(sendTo, "Заявка с сайта: обувь", "orderEmail", {...user}, [file])
  } */

  res.status(200).send({ fieId: fileDt.id, filename: fileDt.name, message: `File created for ${userId}` });
};

export const CreateSpecifyClothes = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  const userId = UserIdFromAuth(req);
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
  await WriteOrder ([fileDt.id], userId);

  console.log("Data to send: ", file, user, sendTo)

  if (user && sendTo && file) {
    console.log("Sending order file: ")
    sendEmail(sendTo, "Заявка с сайта: одежда", "orderEmail", {...user}, [file])
  }

  res.status(200).send({ fieId: fileDt.id, filename: fileDt.name, message: `File created for ${userId}` });
};

export const DeleteFile = async (req: Request, res: Response) => {
  const userId = UserIdFromAuth(req);
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
