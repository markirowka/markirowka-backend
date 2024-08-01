import { Request, Response } from "express";
import "express-session";
import {
  MenuItem,
  createMenuItem,
  deleteMenuItems,
  getMenuItems,
  updateMenuItem,
} from "../models/menu";
import { IsAdmin } from "./authController";

export const GetMenu = async (req: Request, res: Response) => {
  const menu = await getMenuItems();
  res.status(200).send({ menu });
};

export const UpdateMenuItems = async (req: Request, res: Response) => {
  const isFromAdmin = await IsAdmin({ req });
  if (!isFromAdmin) {
    res.status(403).send({ error: "No rigths to collaborate" });
    return;
  }

  const items: MenuItem[] = req.body?.items;

  if (!items) {
    res.status(400).send({ error: "Items to update not found" });
    return;
  }

  try {
    items.forEach((item) => {
      updateMenuItem(item.id, item.name, item.url, item.sort_index);
    });
    res.status(200).send({ success: true });
  } catch (e) {
    res.status(500).send({ error: "Failed to update items" });
    return;
  }
};

export const CreateMenuItems = async (req: Request, res: Response) => {
  const isFromAdmin = await IsAdmin({ req });
  if (!isFromAdmin) {
    res.status(403).send({ error: "No rigths to collaborate" });
    return;
  }

  const items: MenuItem[] = req.body?.items;

  if (!items) {
    res.status(400).send({ error: "Items to create not found" });
    return;
  }

  try {
    items.forEach((item) => {
      createMenuItem(item.name, item.url, item.sort_index);
    });
    res.status(200).send({ success: true });
  } catch (e) {
    res.status(500).send({ error: "Failed to update items" });
    return;
  }
};

export const DeleteMenuItems = async (req: Request, res: Response) => {
    const isFromAdmin = await IsAdmin({ req });
    if (!isFromAdmin) {
      res.status(403).send({ error: "No rigths to collaborate" });
      return;
    }
  
    const items: MenuItem[] = req.body?.items;
  
    if (!items) {
      res.status(400).send({ error: "Items to create not found" });
      return;
    }
  
    try {
        deleteMenuItems(items.map((item) => {
            return item.id
        }));
      res.status(200).send({ success: true });
    } catch (e) {
      res.status(500).send({ error: "Failed to update items" });
      return;
    }
  };