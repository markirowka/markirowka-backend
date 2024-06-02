import { Request, Response } from "express";
import 'express-session';
import { GetAuthorizedUserData, UserIdFromAuth } from "./authController";
import { CheckAndCreateOwnerFolder, CreateFileNameDBNote, GetUserById, itemData } from "../models";
import { GenerateSpecify } from "../views/specify";
import { GenerateT12PDF } from "../views/t12";

export const CreateT12 = async (req: Request, res: Response) => {
    const userId = UserIdFromAuth (req);
    if (!userId) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
    }

    if (!req.body.items) {
        res.status(400).send({ error: 'Request has no any items' })
    }

    const itemList: itemData[] = req.body.items;

    const user = await GetUserById (userId);

    if (!user) {
        res.status(400).send({ error: 'User not found' });
        return;
    }


    try {
        const fileName = await CreateFileNameDBNote (userId, 'specify');
        const createFile = await GenerateT12PDF (user, fileName, itemList)
    } catch (e: any) {
        console.log(e.message);
        res.status(500).send({ error: `File creation failed` });
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