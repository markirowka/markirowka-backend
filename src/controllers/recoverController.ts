import { Request, Response } from "express";
import 'express-session';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../models/db";
import nodemailer from "nodemailer";
import { GetUserById, GetUsersByParam, User } from "../models/user";
import { IsValidEmail } from "../utils";
import sendEmail from "./emailController";
import { authPrivateKey } from "./authController";
import { SetupHeaders } from "./indexController";

export const RequestToRecoverPassword = async (req: Request, res: Response) => {
    // SetupHeaders (res);
    const { email } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM app_users WHERE email = $1', [email.toLowerCase()]);
        if (!userResult || userResult.rows.length === 0){
            res.status(400).send({ error: "User not found"})
            return;
        }
        const user = userResult.rows[0];
        if (!user) {
            res.status(400).send({ error: "User not found"})
            return;
        }

        if (!IsValidEmail(email)) {
            res.status(400).send({ error: "Invalid Email"})
            return;
        }

        const protocol = process.env.HTTP_PROTOCOL
        const host = process.env.HTTP_HOST

        
        const token = jwt.sign({ userId: user.id }, authPrivateKey, { expiresIn: '1h' });
        const emailRecoverink = `${protocol}://${host}/recoverpassword?token=${token}`;

        await sendEmail (email, "Восстановление пароля", "recoverEmail", {
            link: emailRecoverink,
            user: user.full_name || user.inn
        })

        res.status(200).send({ message: "Recover email sent" })

    } catch (e: any) {
        console.log(e.message);
        res.status(500).send({ error: "Failed to get user"})
    }
}

export const SetupNewPassword = async (req: Request, res: Response) => {
    // SetupHeaders (res);
    const { token, newPassword } = req.body;

    let payload;
    try {
        payload = jwt.verify(token, authPrivateKey) as { userId: number };
    } catch (e) {
        return res.status(400).send({message: 'Invalid or expired token.'});
    }
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE app_users SET password = $1 WHERE id = $2', [hashedPassword, payload.userId]);
    
        res.status(200).send({message: 'Password has been reset.'});
    } catch (e: any) {
        console.log(e.message)
        return res.status(500).send({error: 'Internal server error'});
    }
}