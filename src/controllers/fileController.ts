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

export const CreatePaymentFiles = async (req: Request, res: Response) => {
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

    GeneratePaymentPDF(user, fileNames[0], itemList, "t12");
    GeneratePaymentPDF(user, fileNames[1], itemList, "invoice");
    GeneratePaymentPDF(user, fileNames[2], itemList, "agreement");
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
  const fileName = await CreateFileNameDBNote(userId, "specify");
  const file = await GenerateSpecify(userId, fileName, itemList);

  res.status(200).send({ message: `File created for ${userId}` });
};
