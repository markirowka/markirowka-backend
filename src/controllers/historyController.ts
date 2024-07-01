import { Request, Response } from "express";
import "express-session";
import { GetAuthorizedUserData, IsAdmin, UserIdFromAuth } from "./authController";
import { getOrderList, getTotalOrderCount, getUserOrderCount, getUserOrderList } from "../models/orderHistory";

export const GetOrderHistory = async (req: Request, res: Response) => { 

    const userId = UserIdFromAuth(req);
    const page: number = Number(req.params.page) || 1;
    if (!userId) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }

    const orders = await getUserOrderList (userId, page);
    res.status(200).send({ orders })
}

export const GetTotalOrderHistory = async (req: Request, res: Response) => { 

    const isFromAdmin = await IsAdmin ({req});
    const page: number = Number(req.params.page) || 1;
    if (!isFromAdmin) {
        res.status(403).send({ error: "No rigths to watch"});
        return;
    }

    const orders = await getOrderList (page);
    res.status(200).send({ orders })
}

export const GetOrderCount = async (req: Request, res: Response) => { 
    const isFromAdmin = await IsAdmin ({req});
    if (!isFromAdmin) {
        res.status(403).send({ error: "No rigths to delete user"});
        return;
    }

    const count = await getTotalOrderCount ()
    res.status(200).send({ count })
}

export const GetOrderCountPerUser = async (req: Request, res: Response) => { 
    const userId = UserIdFromAuth(req);
    if (!userId) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }

    const count = await getUserOrderCount (userId)
    res.status(200).send({ count })
}