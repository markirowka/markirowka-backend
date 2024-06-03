import { Request, Response } from "express";
import 'express-session';
import { userEditRequest, forbiddenToEditParams, EditUserParams, forbiddenToEditParamsAdmin } from "../models";
import { GetAuthorizedUserData, IsAdmin, UserIdFromAuth } from "./authController";
import { IsValidEmail } from "../utils";



export const EditUserParamByUser = async (req: Request, res: Response) => {
    const body: userEditRequest = req.body;
    const requesterId = await UserIdFromAuth (req);
    if (!requesterId) {
        res.status(403).send({ error: "No rigths to edit user"});
        return;
    }

    const params = body.paramsToEdit;
    for (let k = 0; k < params.length; k++) {
        if (forbiddenToEditParams.indexOf(params[k].key) > -1) {
            res.status(403).send({ error: "Edit of some params is forbidden"});
            return;
        } 
    }

    try {
        EditUserParams(params, requesterId);
        res.status(200).send({ message: 'User params updated'});
    } catch (e: any) {
        console.log(e.message);
        res.status(500).send({ message: 'Error in request processing'});
    }
}

export const EditUserParamsByAdmin = async (req: Request, res: Response) => {
    const body: userEditRequest = req.body;
    const isFromAdmin = await IsAdmin ({req});
    if (!isFromAdmin) {
        res.status(403).send({ error: "No rigths to edit"});
        return;
    }

    if (!body.userId) {
        res.status(400).send({ error: "User is not defined"});
        return;
    }

    const params = body.paramsToEdit;
    for (let k = 0; k < params.length; k++) {
        if (params[k].key === 'email' && !IsValidEmail(params[k].value)) {
            res.status(400).send({ error: "Invalid email"});
            return;
        }
        if (forbiddenToEditParamsAdmin.indexOf(params[k].key) > -1) {
            res.status(403).send({ error: "Edit of some params is forbidden"});
            return;
        } 
    }
    try {
        EditUserParams(params, body.userId);
        res.status(200).send({ message: 'User params updated'});
    } catch (e: any) {
        console.log(e.message);
        res.status(500).send({ message: 'Error in request processing'});
    }
}