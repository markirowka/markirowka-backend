import { Request, Response } from "express";
import 'express-session';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../models/db";
import nodemailer from "nodemailer";
import { GetUserById, GetUsersByParam, User } from "../models/user";
import { IsValidEmail } from "../utils";
import sendEmail from "./emailController";

declare module 'express-session' {
    export interface SessionData {
      token: any;
    }
  }

if (!process.env.JWT_SECRET_KEY) {
  throw new Error("Auth key is not defined");
}

const authPrivateKey = String(process.env.JWT_SECRET_KEY);

const signup = async (req: Request, res: Response) => {
  const {
    email,
    password,
    full_name,
    ceo,
    ceo_full,
    ceo_genitive,
    law_address,
    inn,
    cargo_recevier,
    cargo_city,
    user_role,
  } = req.body;

  if (!email) {
    res.status(400).send({ success: false, error: "Email is missed" });
    return;
  }

  if (!inn) {
    res.status(400).send({ success: false, error: "Inn is missed" });
    return;
  }

  if (!password) {
    res.status(400).send({ success: false, error: "Password is missed" });
    return;
  }

  if (!IsValidEmail(email)) {
    res.status(400).send({ success: false, error: "Email is invalid" });
    return;
  }

  const ExistUser = await GetUsersByParam ("inn", inn)

  if (ExistUser.length > 0) {
    res.status(400).send({ success: false, error: "User is already exists" });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO app_users 
      ( email,
        password_hash,
        full_name,
        ceo,
        ceo_full,
        ceo_genitive,
        law_address,
        inn,
        cargo_recevier,
        cargo_city,
        isconfirmed,
        user_role ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [email, 
        password_hash, 
        full_name || "", 
        ceo || "", 
        ceo_full || "", 
        ceo_genitive || "", 
        law_address || "",
        inn,
        cargo_recevier || "",
        cargo_city || "",
        false, 
        "USER"]
    );

    const user: User = result.rows[0];

    const userId = user.id

    // Send verification email logic here
    const token = jwt.sign({ userId }, authPrivateKey, {
        expiresIn: "1d",
      });
    
    console.log("Verify token: ", token)
    const protocol = process.env.HTTP_PROTOCOL
    const host = process.env.HTTP_HOST
    const port = process.env.HTTP_PORT

    const emailVerifyLink = `${protocol}://${host}:${port}/api/signupconfirm?token=${token}`;

    console.log(emailVerifyLink);

    sendEmail(user.email, "Sign up verification", "verifyEmail", {
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
  const { email, password } = req.body;

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

    if (!user || !user.password_hash) {
        return res
        .status(400)
        .json({ success: false, error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

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

    res.json({ token, userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  console.log("Params: ", req.params, "Query: ", req.query)
  const token = req.query.token;
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

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const recoverPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM app_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, authPrivateKey, {
      expiresIn: "1h",
    });

    // Send password reset email logic here

    res.json({ message: "Password reset email sent" });
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
        res.status(401).json({ error: 'Unauthorized' });
      }
}

export function UserIdFromAuth (req: Request): number| null {
    const token = req.session.token;
    console.log("Sign in token: ", token);

    if (!token) {
        return null
      }
    
      try {
        const decoded = jwt.verify(token, authPrivateKey);
        console.log(decoded);
        if (typeof decoded === "string") return null;
        return decoded.userId
      } catch (error) {
        console.error('Error verifying token:', error);
        return null;
      }
}

export const GetAuthorizedUserData = async (req: Request, res: Response) =>  {
    const token = req.session.token;
    console.log("Sign in token: ", token);

    if (!token) {
        res.status(401).send({ error: 'Unauthorized' })
        return;
      }
    
      try {
        const decoded = jwt.verify(token, authPrivateKey);
        console.log(decoded);
        if (typeof decoded === "string") {
            res.status(401).send({ error: 'Unauthorized' });
            return;
        }
        const userData =  await GetUserById(Number(decoded.userId));
        if (!userData) {
            res.status(400).send({ error: 'Invalid user' });
            return;
        }
        const { password_hash, ...dataToDisplay} = userData;
        res.status(200).send({
            data: dataToDisplay
        })
        return decoded.userId
      } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).send({ error: 'Unauthorized' })
      }
}


export { signup, signin, verifyEmail, recoverPassword };
