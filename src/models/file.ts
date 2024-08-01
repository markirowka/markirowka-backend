import fs from "fs";
import path from "path";
import pool from "./db";

export const rootFolder = process.env.FILE_ROOT_FOLDER || "files/";

/* 
        const header = [
            'Код ТНВЭД',
            'Код категории',
            'Полное наименование товара',
            'Товарный знак',
            'Модель/Артикул производителя',
            'Модель/Артикул производителя',
            'Вид товара',
            'Цвет',
            'Размер',
            'Материал верха',
            'Материал подкладки',
            'Материал низа/подошвы',
        ];
*/

export interface itemDataShoes {
  fullName?: string;
  tradeMark?: string;
  articleType?: string;
  articleName?: string;
  shoesType?: string;
  color?: string;
  size?: string;
  upperMaterial?: string;
  liningMaterial?: string;
  bottomMaterial?: string;
  tnved?: string;
}

export interface itemDataClothes {
  fullName?: string;
  tradeMark?: string;
  articleType?: string;
  articleName?: string;
  clothesType?: string;
  color?: string;
  size?: string;
  composition?: string;
  tnved?: string;
}

export const sampleItemShoes: itemDataShoes = {
  fullName: "",
  tradeMark: "",
  articleType: "",
  articleName: "",
  shoesType: "",
  color: "",
  size: "",
  upperMaterial: "",
  liningMaterial: "",
  bottomMaterial: "",
  tnved: "",
};

export const sampleItemClothes: itemDataClothes = {
  fullName: "",
  tradeMark: "",
  articleType: "",
  articleName: "",
  clothesType: "",
  color: "",
  size: "",
  composition: "",
  tnved: "",
};

export interface itamDataShoes {}

export interface fileDownloadData {
  id: number;
  owner_id: number;
  file_name: string;
  file_type: string;
}

export interface paymentDocumentData {
  category: string;
  name: string;
  quantity: number;
  price: number;
}

export async function GetNewFileId(): Promise<number> {
  const query = `SELECT max("id") FROM "user_files";`;
  try {
    const result = await pool.query(query);
    console.log("File selection result: ", result.rows);
    if (result.rows.length === 0) {
      return 1;
    }
    return result.rows[0].max ? Number(result.rows[0].max) + 1 : 1;
  } catch (e: any) {
    console.log(e.message);
    return 1;
  }
}

export function createFileName(
  ownerId: number,
  fileType: string,
  fileId?: number
) {
  const dt = new Date();
  const fileExt: string = (() => {
    switch (fileType) {
      case "specify":
        return "xlsx";
      case "zip":
        return "zip";
      default:
        return "pdf";
    }
  })();
  return `${fileType}_${fileId || 'doc'}_${ownerId}_${dt.getFullYear()}_${dt.getMonth()}_${dt.getDay()}_${dt.getHours()}_${dt.getMinutes()}_${dt.getSeconds()}.${fileExt}`;
}

export async function CreateFileNameDBNote(
  ownerId: number,
  fileType: string
): Promise<{ id: number; name: string }> {
  const fileId = await GetNewFileId();

  const newFileName = createFileName(ownerId, fileType, fileId);
  const fileAddQuery = `
   INSERT INTO public.user_files(
	file_name, file_type, owner_id)
	VALUES ('${newFileName}', '${fileType}', ${ownerId});
   `;
  try {
    const result = await pool.query(fileAddQuery);
    return { id: fileId, name: newFileName };
  } catch (e: any) {
    console.log(e.message);
    return { id: 0, name: "" };
  }
}

export async function CheckAndCreateOwnerFolder(
  ownerId: number
): Promise<boolean> {
  const dirPath = `${rootFolder}${ownerId}`;
  try {
    await fs.promises.access(dirPath, fs.constants.F_OK);
    return true;
  } catch (error) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return true;
    } catch (e: any) {
      console.log(e.message);
      return false;
    }
  }
}
export async function GetDownloads(
  userId: number
): Promise<fileDownloadData[]> {
  const files: fileDownloadData[] = [];
  const query = `SELECT * FROM "user_files" WHERE "owner_id" = ${userId};`;

  try {
    const result = await pool.query(query);
    result.rows.forEach((row) => {
      files.push(row);
    });
  } catch (e: any) {
    console.log(e.message);
  }

  return files;
}
