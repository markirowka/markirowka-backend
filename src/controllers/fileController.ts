import { Request, Response } from "express";
import "express-session";
import { GetAuthorizedUserData, UserIdFromAuth } from "./authController";
import {
  CheckAndCreateOwnerFolder,
  CreateFileNameDBNote,
  GetUserById,
  itemData,
  paymentDocumentData,
} from "../models";
import { GenerateSpecify } from "../views/specify";
import { GeneratePaymentPDF } from "../views/paymentDocs";
import { SetupHeaders } from "./indexController";

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
    const fileNames = await Promise.all([
      CreateFileNameDBNote(userId, "t12"),
      CreateFileNameDBNote(userId, "invoice"),
      CreateFileNameDBNote(userId, "agreement"),
    ]);

    GeneratePaymentPDF(user, fileNames[0].name, itemList, "t12", fileNames[0].id);
    GeneratePaymentPDF(user, fileNames[1].name, itemList, "invoice", fileNames[1].id);
    GeneratePaymentPDF(user, fileNames[2].name, itemList, "agreement", fileNames[2].id);
    res
      .status(200)
      .send({ message: `Files created for ${userId}`, files: fileNames });
  } catch (e: any) {
    console.log(e.message);
    res.status(500).send({ error: `File creation failed` });
    return;
  }
};

export const CreateSpecify = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  const userId = UserIdFromAuth(req);
  if (!userId) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  if (!req.body.items) {
    res.status(400).send({ error: "Request has no any items" });
  }

  const itemList: itemData[] = req.body.items;
  await CheckAndCreateOwnerFolder(userId);
  const fileDt = await CreateFileNameDBNote(userId, "specify");
  const file = await GenerateSpecify(userId, fileDt.name, itemList);

  res.status(200).send({ message: `File created for ${userId}` });
};
