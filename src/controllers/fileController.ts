import { Request, Response } from "express";
import 'express-session';
import { UserIdFromAuth } from "./authController";
import { CheckAndCreateOwnerFolder, CreateFileNameDBNote, itemData } from "../models";
import { GenerateSpecify } from "../views/specify";

export const CreateT12 = async (req: Request, res: Response) => {
    const userId = UserIdFromAuth (req);
    if (!userId) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
    }

    res.status(200).send({ message: `File created for ${userId}` })
}

export const CreateSpecify = async (req: Request, res: Response) => {
    const userId = UserIdFromAuth (req);
    if (!userId) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
    }

    if (!req.body.items) {
        res.status(400).send({ error: 'Request has no any items' })
    }

    const itemList: itemData[] = req.body.items;
    await CheckAndCreateOwnerFolder(userId);
    const fileName = await CreateFileNameDBNote (userId, 'specify');
    const file = await GenerateSpecify (userId, fileName, itemList);

    res.status(200).send({ message: `File created for ${userId}` })
}