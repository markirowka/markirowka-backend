import { Request, Response } from "express";
import "express-session";
import { IsAdmin } from "./authController";
import { createArticle, deleteArticleByUrl, getArticle, getArticleByUrl, updateArticle, updateArticleByUrl } from "../models/content";
import { urlNamingFilter } from "../utils";


export const SetContent = async (req: Request, res: Response) => {
    const isFromAdmin = await IsAdmin({ req });
  if (!isFromAdmin) {
    res.status(403).send({ error: "No rigths to collaborate" });
    return;
  }

  const body = req.body 

  if (!body.pageUrl) {
    res.status(400).send({ error: "Page url is not defined" });
    return;
  }
  try {
    const existArticle = await getArticleByUrl(body.pageUrl);
    if (!existArticle || existArticle.length === 0) {
      await createArticle(urlNamingFilter(body.pageUrl), body.pageTitle || "", body.content || "");
    } else {
      await updateArticleByUrl(urlNamingFilter(body.pageUrl), body.pageTitle || "", body.content || "");
    }

    res.status(200).send({ success: true })
  } catch (e: any) {
    console.error(e);
    res.status(500).send({ error: "Failed to save content"})
  } 

}

export const DeletePage = async (req: Request, res: Response) => { 
    const isFromAdmin = await IsAdmin({ req });
    if (!isFromAdmin) {
      res.status(403).send({ error: "No rigths to collaborate" });
      return;
    }

    const body = req.body 

  if (!body.pageUrl) {
    res.status(400).send({ error: "Page url is not defined" });
    return;
  }

  try {
    await deleteArticleByUrl (body.pageUrl);
    res.status(200).send({ success: true })
  } catch (e: any) {
    console.log(e);
    res.status(500).send({ error: "Failed to save content"})
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
        if (!page || page.length === 0){ 
            res.status(404).send({ error: "Page not found" });
            return;
        }
        res.status(200).send({ page: {
            id: page[0].id,
            pageTitle: page[0].title,
            content: page[0].content,
            url_name: page[0].url_name
        } })
      } catch (e: any) {
        console.log(e);
        res.status(500).send({ error: "Failed to save content"})
      } 
};


