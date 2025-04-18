import { Request, Response } from "express";
import "express-session";
import { IsAdmin } from "./authController";
import {
  createArticle,
  createContentBlock,
  deleteArticleByUrl,
  deleteContentBlock,
  getArticleByUrl,
  getArticleIdByUrl,
  getContentBlocksByUrl,
  updateArticleByUrl,
  updateContentBlock,
} from "../models/content";
import { urlNamingFilter } from "../utils";
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../models/cetegories";

export const SetContent = async (req: Request, res: Response) => {
  const isFromAdmin = await IsAdmin({ req });
  if (!isFromAdmin) {
    res.status(403).send({ error: "No rigths to collaborate" });
    return;
  }

  const body = req.body;

  if (!body.pageUrl) {
    res.status(400).send({ error: "Page url is not defined" });
    return;
  }
  try {
    const existArticle = await getArticleByUrl(body.pageUrl);
    if (!existArticle || existArticle.length === 0) {
      await createArticle(
        urlNamingFilter(body.pageUrl),
        body.pageTitle || "",
        body.content || ""
      );
    } else {
      await updateArticleByUrl(
        urlNamingFilter(body.pageUrl),
        body.pageTitle || "",
        body.content || ""
      );
    }

    res.status(200).send({ success: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).send({ error: "Failed to save content" });
  }
};

export const DeletePage = async (req: Request, res: Response) => {
  const isFromAdmin = await IsAdmin({ req });
  if (!isFromAdmin) {
    res.status(403).send({ error: "No rigths to collaborate" });
    return;
  }

  const body = req.body;

  if (!body.pageUrl) {
    res.status(400).send({ error: "Page url is not defined" });
    return;
  }

  try {
    await deleteArticleByUrl(body.pageUrl);
    res.status(200).send({ success: true });
  } catch (e: any) {
    console.log(e);
    res.status(500).send({ error: "Failed to save content" });
  }
};

export const GetPage = async (req: Request, res: Response) => {
  const url = req.params.url;
  if (!url) {
    res.status(404).send({ error: "Page not found" });
    return;
  }

  try {
    const page = await getArticleByUrl(url);
    if (!page || page.length === 0) {
      res.status(404).send({ error: "Page not found" });
      return;
    }
    res.status(200).send({
      page: {
        id: page[0].id,
        pageTitle: page[0].title,
        content: page[0].content,
        url_name: page[0].url_name,
      },
    });
  } catch (e: any) {
    console.log(e);
    res.status(500).send({ error: "Failed to save content" });
  }
};

export const getPageContentBlocks = async (req: Request, res: Response) => {
  const url = req.params.url;
  if (!url) {
    res.status(404).send({ error: "Page not exist" });
    return;
  }
  const blocks = await getContentBlocksByUrl(url);
  res.status(200).send({
    blocks,
  });
};

export const createPageContentBlock = async (req: Request, res: Response) => {
  const isAdmin = await IsAdmin({ req });
  if (!isAdmin) {
    res.status(403).send({ error: "No rights to edit" });
    return;
  }

  const body = req.body;
  if (!body.url) {
    res.status(400).send({ error: "Page url is not defined" });
    return;
  }
  const articleId = body.url ? await getArticleIdByUrl(body.url) : undefined;
  const id = await createContentBlock({
    id: body.id,
    article_id: articleId,
    content: body.content || "",
  });

  res.status(200).send({
    success: !!id,
    id,
  });
};

export const updatePageContentBlock = async (req: Request, res: Response) => {
  const isAdmin = await IsAdmin({ req });
  if (!isAdmin) {
    res.status(403).send({ error: "No rights to edit" });
    return;
  }

  const body = req.body;
  if (!body.id) {
    res.status(400).send({ error: "Block is not defined" });
    return;
  }

  const success = await updateContentBlock({
    id: body.id,
    content: body.content || "",
  });

  res.status(200).send({
    success,
  });
};

export const deletePageContentBlock = async (req: Request, res: Response) => {
  const isAdmin = await IsAdmin({ req });
  if (!isAdmin) {
    res.status(403).send({ error: "No rights to delete" });
    return;
  }

  if (!req.body.id) {
    res.status(404).send({ error: "Page id is not defined" });
    return;
  }

  const success = await deleteContentBlock(Number(req.body.id));
  res.status(200).send({
    success,
  });
};

export const getCategoriesController = async (req: Request, res: Response) => {
  const categories = await getCategories();
  res.status(200).send({
    categories,
  });
};

export const addCategoryController = async (req: Request, res: Response) => {
  const isAdmin = await IsAdmin({ req });
  const { id, name, metrik, okei_code } = req.body;
  if (!isAdmin) {
    res.status(403).send({ error: "No rights to delete" });
    return;
  }

  if (!name) {
    res.status(400).send({ error: "No category name" });
    return;
  }
  const success = !id? await addCategory(name, metrik, okei_code) : await updateCategory(id, name, metrik, okei_code);
  res.status(200).send({
    success,
  });
};

export const dropCategoryController = async (req: Request, res: Response) => {
  const isAdmin = await IsAdmin({ req });
  const { category_id } = req.body;
  if (!isAdmin) {
    res.status(403).send({ error: "No rights to delete" });
    return;
  }

  if (!category_id) {
    res.status(400).send({ error: "No category name" });
    return;
  }

  const success = await deleteCategory(Number(category_id));
  res.status(200).send({
    success,
  });
};
