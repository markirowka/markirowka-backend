import { Request, Response } from "express";
import "express-session";
import {
  GetAuthorizedUserData,
  IsAdmin,
  getUserIdFromAuth,
} from "./authController";
import {
  getOrderList,
  getTotalOrderCount,
  getUserOrderCount,
  getUserOrderList,
  massUpdateOrderStatus,
  orderSatusList,
  orderStatusValues,
} from "../models/orderHistory";
import sendEmail from "./emailController";
import { orderSendTo } from "../config";
import { GetUserById } from "../models";

export const GetOrderHistory = async (req: Request, res: Response) => {
  const userId = getUserIdFromAuth(req);
  const page: number = Number(req.params.page) || 1;
  if (!userId) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  const orders = await getUserOrderList(userId, page);
  res.status(200).send({ orders });
};

export const GetTotalOrderHistory = async (req: Request, res: Response) => {
  const isFromAdmin = await IsAdmin({ req });
  const page: number = Number(req.params.page) || 1;
  if (!isFromAdmin) {
    res.status(403).send({ error: "No rigths to watch" });
    return;
  }

  const orders = await getOrderList(page);
  res.status(200).send({ orders });
};

export const GetOrderCount = async (req: Request, res: Response) => {
  const isFromAdmin = await IsAdmin({ req });
  if (!isFromAdmin) {
    res.status(403).send({ error: "No rigths to watch value" });
    return;
  }

  const count = await getTotalOrderCount();
  res.status(200).send({ count });
};

export const GetOrderCountPerUser = async (req: Request, res: Response) => {
  const userId = getUserIdFromAuth(req);
  if (!userId) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  const count = await getUserOrderCount(userId);
  res.status(200).send({ count });
};

export const OrderStatusUpdater = async (req: Request, res: Response) => {
  const isFromAdmin = await IsAdmin({ req });
  const userId = getUserIdFromAuth(req);
  const { orderIds, status } = req.body;
  if (!userId) {
    res.status(401).send({
      error: "Unauthorized",
    });
    return;
  }

  if (!isFromAdmin && status === orderSatusList.paid) {
    res.status(403).send({
      error: "Only admin can accept payment",
    });
    return;
  }

  if (!orderIds || !status || orderStatusValues.indexOf(status) === -1) {
    res.status(400).send({
      error: "Invalid params",
    });
    return;
  }
  try {
    const ids = await massUpdateOrderStatus(
      orderIds,
      status,
      userId,
      !!isFromAdmin
    );
    const user = await GetUserById(userId)
    if (status === orderSatusList.messaged && orderSendTo && user) {
      sendEmail(orderSendTo, "Сообщили об оплате", "payNotifyEmail", {
        user: user.full_name,
        orders: ids.join(", ")
      })
    }
    res.status(200).send({
      ids,
    });
  } catch (error: any) {
    return res.status(500).send({
        error: "Failed to update orders status",
        details: error?.message,
      });
  }
};
