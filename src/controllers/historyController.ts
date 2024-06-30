import { Request, Response } from "express";
import "express-session";
import { GetAuthorizedUserData, IsAdmin, UserIdFromAuth } from "./authController";
import { getOrderList, getUserOrderList } from "../models/orderHistory";

export const GetOrderHistory = async (req: Request, res: Response) => { 

    const userId = UserIdFromAuth(req);
    if (!userId) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }

    const orders = await getUserOrderList (userId);
    res.status(200).send({ orders })
}

export const GetTotalOrderHistory = async (req: Request, res: Response) => { 

    const userId = Number(req.params.id);
    const isFromAdmin = await IsAdmin ({req});
    if (!isFromAdmin) {
        res.status(403).send({ error: "No rigths to delete user"});
        return;
    }

    const orders = await getOrderList ();
    res.status(200).send({ orders })
}