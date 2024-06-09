import { Request, Response } from "express";

export function SetupHeaders (res: Response) {
    res.setHeader("Access-Control-Allow-Origin", "*" );
    res.setHeader('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE");
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}