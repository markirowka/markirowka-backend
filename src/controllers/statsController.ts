import { Request, Response } from "express";
import 'express-session';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../models/db";
import nodemailer from "nodemailer";
import { GetUserById, GetUsersByParam, User } from "../models/user";
import { IsValidEmail } from "../utils";
import sendEmail from "./emailController";
import { authPrivateKey, getUserIdFromAuth } from "./authController";
import { SetupHeaders } from "./indexController";
import { getArticleIdByUrl } from "../models/content";
import { getUserReadStats, setUserArticleStats } from "../models/stats";

export const getUserReadStatsResponce = async (req: Request, res: Response) => {
    const userId = getUserIdFromAuth (req);
    if (!userId) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
    }
    const readInfo = await getUserReadStats(userId);
    res.status(200).send({ stats: readInfo });
}

export const setArticleRead = async (req: Request, res: Response) => {
    const userId = getUserIdFromAuth (req);
    if (!userId) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
    }
    const { url } = req.params;
    const articleId = await getArticleIdByUrl(url);
    if (!articleId) {
        res.status(400).send({ error: 'Unknown page' })
        return;
    } 
    const isMarked = await setUserArticleStats(userId, articleId);
    res.status(200).send({ success: isMarked });
    return;   
}