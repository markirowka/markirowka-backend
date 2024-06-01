import { Request, Response } from "express";
import 'express-session';
import { UserIdFromAuth } from "./authController";

export const CreateT12 = async (req: Request, res: Response) => {
    const userId = UserIdFromAuth (req);
    if (!userId) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
    }

    res.status(200).send({ message: `File created for ${userId}` })
}