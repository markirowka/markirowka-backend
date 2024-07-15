import { Request, Response } from "express";
import "express-session";
import { GetAuthorizedUserData, UserIdFromAuth } from "./authController";
import {
  CheckAndCreateOwnerFolder,
  CreateFileNameDBNote,
  GetUserById,
  itemDataClothes,
  itemDataShoes,
  paymentDocumentData,
} from "../models";
import { GeneratePaymentPDF } from "../views/paymentDocs";
import { WriteOrder } from "../models/orderHistory";
import { GenerateSpecifyShoes } from "../views/specifyShoes";
import { GenerateSpecifyClothes } from "../views/specifyClothes";
import { GenerateSpecifyOrder } from "../views/specifyOrder";
import sendEmail from "./emailController";
import { orderSendTo } from "../config";

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

  const itemList: paymentDocumentData[] = req.body.items;

  const user = await GetUserById(userId);

  if (!user) {
    res.status(400).send({ error: "User not found" });
    return;
  }

  try {
    await CheckAndCreateOwnerFolder(userId);
    
    const fileNames = await Promise.all([
      CreateFileNameDBNote(userId, "specify"),
      CreateFileNameDBNote(userId, "t12"),
      CreateFileNameDBNote(userId, "invoice"),
      CreateFileNameDBNote(userId, "agreement"),
    ]);
    
    await GenerateSpecifyOrder(userId, fileNames[0].name, itemList);
    await GeneratePaymentPDF(user, fileNames[1].name, itemList, "t12", fileNames[0].id);
    await GeneratePaymentPDF(user, fileNames[2].name, itemList, "invoice", fileNames[1].id);
    await GeneratePaymentPDF(user, fileNames[3].name, itemList, "agreement", fileNames[2].id);

    await WriteOrder(fileNames.map((file): number => {
      return file.id
    }), userId);
    res
      .status(200)
      .send({ message: `Files created for ${userId}`, files: fileNames });
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

  const itemList: itemDataShoes[] = req.body.items;
  await CheckAndCreateOwnerFolder(userId);
  const fileDt = await CreateFileNameDBNote(userId, "specify");
  const file = await GenerateSpecifyShoes(userId, fileDt.name, itemList);
  const user = await GetUserById(userId);
  await WriteOrder ([fileDt.id], userId)

  console.log("Data to send: ", file, user, sendTo)

  if (user && sendTo && file) {
    console.log("Sending order file: ")
    sendEmail(sendTo, "Заявка с сайта: обувь", "orderEmail", {phone: user.phone, email: user.email, full_name: user.full_name}, [file])
  }

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

  const itemList: itemDataClothes[] = req.body.items;
  await CheckAndCreateOwnerFolder(userId);
  const fileDt = await CreateFileNameDBNote(userId, "specify");
  const file = await GenerateSpecifyClothes(userId, fileDt.name, itemList);
  const user = await GetUserById(userId);
  await WriteOrder ([fileDt.id], userId);

  console.log("Data to send: ", file, user, sendTo)

  if (user && sendTo && file) {
    console.log("Sending order file: ")
    sendEmail(sendTo, "Заявка с сайта: одежда", "orderEmail", {phone: user.phone, email: user.email, full_name: user.full_name}, [file])
  }

  res.status(200).send({ fieId: fileDt.id, filename: fileDt.name, message: `File created for ${userId}` });
};
