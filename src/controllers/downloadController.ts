import { Request, Response } from "express";
import 'express-session';
import mime from "mime";
import fs from 'fs';
import { UserIdFromAuth } from "./authController";
import { GetDownloads, rootFolder } from "../models";
import { SetupHeaders } from "./indexController";

export const GetUserDownloadList = async (req: Request, res: Response) => {
    // SetupHeaders (res);
    const userId = UserIdFromAuth (req);
    if (!userId) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
    }

    const files = await GetDownloads (userId);

    res.status(200).send({
        files
    });
}

export const DownloadFileByOwner = async (req: Request, res: Response) => {
    // SetupHeaders (res);
    const userId = UserIdFromAuth (req);
    const { id, filename } = req.params;

    if (!userId) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
    }

    if (userId !== Number(id)) {
        res.status(403).send({ error: 'User is not a file owner' })
        return;
    }
  
    const filePath = `${rootFolder}${id}/${filename}`;

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('File not found');
        }
        /* const mimeType = mime.lookup(filePath);
        if (mimeType) {
            res.setHeader('Content-Type', mimeType);
        } */
        res.download(filePath, (err) => {
            if (err) {
                return res.status(500).send('Error downloading file');
            }
        });
    });
}