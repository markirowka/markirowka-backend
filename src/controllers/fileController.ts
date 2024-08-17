import { Request, Response } from "express";
import "express-session";
import archiver from 'archiver';
import { GetAuthorizedUserData, UserIdFromAuth } from "./authController";
import {
  CheckAndCreateOwnerFolder,
  createFileName,
  CreateFileNameDBNote,
  GetUserById,
  ItemDataClothes,
  ItemDataShoes,
  PaymentDocumentData,
  rootFolder,
} from "../models";
import { GeneratePaymentPDF, generateZipArchive } from "../views/paymentDocs";
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
    const orderFile = await CreateFileNameDBNote(userId, "specify");
    const archiveName = await CreateFileNameDBNote(userId, "zip");
    
    await GenerateSpecifyOrder(userId, orderFile.name, itemList);
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
      console.log("Sending order file, attachment: ", `${rootFolder}${userId}/${orderFile.name}`);
      sendEmail(sendTo, "Заявка с сайта: заказ", "orderEmail", {...user, date}, [`${rootFolder}${userId}/${orderFile.name}`])
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
