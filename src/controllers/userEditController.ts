import { Request, Response } from "express";
import 'express-session';
import { userEditRequest, forbiddenToEditParams, EditUserParams, forbiddenToEditParamsAdmin, DeleteUser, GetUserList } from "../models";
import { GetAuthorizedUserData, IsAdmin, UserIdFromAuth } from "./authController";
import { IsValidEmail } from "../utils";
import { SetupHeaders } from "./indexController";


export const EditUserParamByUser = async (req: Request, res: Response) => {
    // SetupHeaders (res);
    const body: userEditRequest = req.body;
    const requesterId = await UserIdFromAuth (req);
    if (!requesterId) {
        res.status(403).send({ error: "No rigths to edit user"});
        return;
    }
    const params = body.paramsToEdit;

    if (!params) {
        res.status(400).send({ error: "Edit params nod found"});
                return;
    }
    try {
        for (let k = 0; k < params.length; k++) {
            if (forbiddenToEditParams.indexOf(params[k].key) > -1) {
                res.status(403).send({ error: "Edit of some params is forbidden"});
                return;
            } 
        }
    } catch (e) {
        res.status(500).send({ message: 'Error in params resolve'});
        return;
    }

    try {
        EditUserParams(params, requesterId);
        res.status(200).send({ message: 'User params updated'});
        return;
    } catch (e: any) {
        console.log(e.message);
        res.status(500).send({ message: 'Error in request processing'});
        return;
    }
}

export const EditUserParamsByAdmin = async (req: Request, res: Response) => {
    SetupHeaders (res);
    const body: userEditRequest = req.body;
    const isFromAdmin = await IsAdmin ({req});
    if (!isFromAdmin) {
        res.status(403).send({ error: "No rigths to edit"});
        return;
    }
    const params = body.paramsToEdit;

    if (!params || !params.find((p) => {
        return p.key === "id"
    })) {
        res.status(400).send({ error: "User is not defined"});
        return;
    }

    for (let k = 0; k < params.length; k++) {
        if (params[k].key === 'email' && !IsValidEmail(params[k].value)) {
            res.status(400).send({ error: "Invalid email"});
            return;
        }
        /* if (forbiddenToEditParamsAdmin.indexOf(params[k].key) > -1) {
            res.status(403).send({ error: "Edit of some params is forbidden"});
            return;
        } */
    }
    try {
        EditUserParams(params, params.find((p) => {
            return p.key === "id"
        })?.value);
        res.status(200).send({ message: 'User params updated'});
    } catch (e: any) {
        console.log(e.message);
        res.status(500).send({ message: 'Error in request processing'});
    }
}

export const DeleteUserByAdmin = async (req: Request, res: Response) => {
    // SetupHeaders (res);
    const userId = Number(req.params.id);
    const isFromAdmin = await IsAdmin ({req});
    if (!isFromAdmin) {
        res.status(403).send({ error: "No rigths to delete user"});
        return;
    }
    if (isNaN(userId) || userId < 1) {
        res.status(400).send({ error: "Invalid user id"});
        return;
    }

    try {
        await DeleteUser (userId);
        res.status(200).send({ message: 'User deleted'});
    } catch (e: any) {
        console.log(e.message);
        res.status(500).send({ message: 'Error in request processing'});
    }
}

export const GetUsers = async (req: Request, res: Response) => {
    const isFromAdmin = await IsAdmin ({req: req});
    if (!isFromAdmin) {
        res.status(403).send({ error: "No rigths to watch all users"});
        return;
    }

    try {
       const users = await GetUserList();
       res.status(200).send({ users: users?.map((item) => {
         const {id, email, full_name, inn, user_role} = item
         return({
            id, email, full_name, inn, user_role
         })
       }) })
    } catch (e: any) {
        console.log(e.message);
        res.status(500).send({error: "Failed to get users"})
    }
}