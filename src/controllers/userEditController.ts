import { Request, Response } from "express";
import 'express-session';
import { userEditRequest } from "../models";
import { GetAuthorizedUserData, IsAdmin, UserIdFromAuth } from "./authController";

export const EditUserParam = async (req: Request, res: Response) => {
    const body: userEditRequest = req.body;
    const isFromAdmin = await IsAdmin ({req});
    const requesterId = await UserIdFromAuth (req);
    if (body.userId === requesterId && !isFromAdmin) {
        res.status(403).send({ error: "No rigths to edit user"});
        return;
    }
}