import { Request, Response } from "express";
import 'express-session';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../models/db";
import nodemailer from "nodemailer";
import { CreateUser, GetUserById, GetUsersByParam, User } from "../models/user";
import { IsValidEmail } from "../utils";
import sendEmail from "./emailController";
import { SetupHeaders } from "./indexController";

declare module 'express-session' {
    export interface SessionData {
      token: any;
    }
  }

if (!process.env.JWT_SECRET_KEY) {
  throw new Error("Auth key is not defined");
}

export const authPrivateKey = String(process.env.JWT_SECRET_KEY);

const signup = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  const userData: User = req.body;

  if (!userData.email) {
    res.status(400).send({ success: false, error: "Email is missed" });
    return;
  }

  if (!userData.inn) {
    res.status(400).send({ success: false, error: "Inn is missed" });
    return;
  }

  if (!userData.password) {
    res.status(400).send({ success: false, error: "Password is missed" });
    return;
  }

  if (!IsValidEmail(userData.email)) {
    res.status(400).send({ success: false, error: "Email is invalid" });
    return;
  }

  const ExistUser = await GetUsersByParam ("inn", userData.inn)

  if (ExistUser.length > 0) {
    res.status(400).send({ success: false, error: "User is already exists" });
    return;
  }

  try {
    const user = await CreateUser(userData)

    if (!user) {
      res.status(500).send({ error: "User creation failed" })
      return;
    }

    const userId = user.id

    // Send verification email logic here
    const token = jwt.sign({ userId }, authPrivateKey, {
        expiresIn: "1d",
      });
    
    console.log("Verify token: ", token)
    const protocol = process.env.HTTP_PROTOCOL
    const host = process.env.HTTP_HOST
    const port = process.env.HTTP_PORT

    const emailVerifyLink = `${protocol}://${host}:${port}/signupconfirm?token=${token}`;

    console.log(emailVerifyLink);

    sendEmail(user.email, "Подтверждение регистрации", "verifyEmail", {
        link: emailVerifyLink,
        user: user.full_name || user.inn
    })

    res
      .status(200)
      .json({ message: "User created", id: userId, email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const signin = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  const { email, password } = req.body;
  console.log("Received body: ", req.body);
  try {
    const result = await pool.query(
      "SELECT * FROM app_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid email or password" });
    }

    const user: User = result.rows[0];

    if (!user || !user.password) {
        return res
        .status(400)
        .json({ success: false, error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid email or password" });
    }

    const userId = user.id

    const token = jwt.sign({ userId }, authPrivateKey, {
      expiresIn: "1d",
    });
    req.session.token = token;
    req.session.save((err) => {
      if (err) {
        console.error('Ошибка сохранения сессии:', err);
        return res.status(500).send({ error: 'Failed to save session'});
      }
      res.json({ token, userId });
      return;
    });
    // res.json({ token, userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  // SetupHeaders (res);
  console.log("Params: ", req.params, "Query: ", req.query)
  const token = req.body.token;
 if (!token) {
    res.status(400).json({ error: "Token is missed" });
    return;
 }
  try {
    const decoded: any = jwt.verify(String(token), authPrivateKey);
    const userId = decoded.userId;

    await pool.query("UPDATE app_users SET isConfirmed = $1 WHERE id = $2", [
      true,
      userId,
    ]);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export async function IsAuthCheck (req: Request, res: Response) {
    const token = req.session.token;
    console.log("Sign in token: ", token);

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    
      try {
        const decoded = jwt.verify(token, authPrivateKey);
        console.log(decoded);
        res.status(200).json({ success: true })
      } catch (error) {
        console.error('Error verifying token:', error);
        res.status(403).json({ error: 'Unauthorized' });
      }
}

export function UserIdFromAuth (req: Request): number| null {
    const token = req.session.token;
    // console.log("Sign in token: ", token);

    if (!token) {
        return null
      }
    
      try {
        const decoded = jwt.verify(token, authPrivateKey);
        // console.log(decoded);
        if (typeof decoded === "string") return null;
        return decoded.userId
      } catch (error) {
        console.error('Error verifying token:', error);
        return null;
      }
}

export async function IsAdmin (args: {id?: number, req?: Request}): Promise<boolean> {
  if (!args.id && !args.req) {
    return false
  }
  const userId = args.id || (!args.req) ? 0 : (await UserIdFromAuth (args.req)  || 0);
  if (userId === 0) return false;
  const userData = await GetUserById (userId);
  if (!userData) {
    return false;
  }
  return userData.user_role === "ADMIN" ? true : false
}

export const GetAuthorizedUserData = async (req: Request, res: Response) =>  {
    // SetupHeaders (res);
    const token = req.session.token;
    console.log("Sign in token: ", token);

    if (!token) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
      }
    
      try {
        const decoded = jwt.verify(token, authPrivateKey);
        console.log("Decoded data: ", decoded);
        if (typeof decoded === "string") {
            res.status(403).send({ error: 'Invalid auth token' });
            return;
        }
        const userData =  await GetUserById(Number(decoded.userId));
        if (!userData) {
            res.status(400).send({ error: 'Invalid user' });
            return;
        }
        const { password, ...dataToDisplay} = userData;
        res.status(200).send({
            data: dataToDisplay
        })
        return decoded.userId
      } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).send({ error: 'Unauthorized' })
      }
}


const logout = (req: Request, res: Response) => {
  try {
    req.session.destroy((err) =>{
      if (err) {
        res.status(400).send({ message: 'Logout failed'});
        return;
      }
      res.clearCookie('connect.sid'); 
      res.status(200).send({ message: 'Logout success'})
   })
  } catch (e) {
    res.status(500).send({ error: 'Server error'})
  }
};

export { signup, signin, verifyEmail, logout };
