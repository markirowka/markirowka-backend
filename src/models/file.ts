import fs from "fs";
import path from "path";
import pool, { Q } from "./db";
import { deleteFiles } from "../views/paymentDocs";

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

export interface ItemDataShoes {
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

export interface ItemDataClothes {
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

export const sampleItemShoes: ItemDataShoes = {
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

export const sampleItemClothes: ItemDataClothes = {
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

export interface FileDownloadData {
  id: number;
  owner_id: number;
  file_name: string;
  file_type: string;
}

export interface PaymentDocumentData {
  category: string;
  name: string;
  quantity: number;
  price: number;
  tnved?: number;
  date?: string;
  country?: string;
}

/* 
1) Вес пункт 11 2) Объем пункт 12 
3) Кол-во грузовых мест пункт 7 
4) Вид упаковки (Сделать выбор Короба/Мешки/Паллеты) пункт 8 
5) ФИО водителя пункт 16 под ним свободное место 
6) Перечислить все пердоставляемые документы пункт 5 
7) Марка авто пункт 26 
8 ) Путевой лист номер (который в документах. формируется) пункт 23 
9) Регестрационный номер машины и регистрационный номер прицепа (Отдельные одно можно заполнить без второго) пункт 25
*/

export interface CMRDeliveryData {
    weight: string;
    volume: string;
    cargoPlaceCount: number;
    packType: string;
    driverName: string;
    documents: string;
    autoMark: string;
    autoNumber?: string;
    subAutoNumber?: string;
}

export interface CategoryData {
  category: string;
  quantity: number;
  code: number;
}

export async function GetNewFileId(): Promise<number> {
  const query = `SELECT nextval(pg_get_serial_sequence('user_files', 'id'));`;
  try {
    const result = await pool.query(query);
    console.log("File selection result: ", result.rows);
    if (result.rows.length === 0) {
      return 1;
    }
    return result.rows[0].nextval ? Number(result.rows[0].nextval) + 1 : 1;
  } catch (e: any) {
    console.log(e.message);
    return 1;
  }
}

export function createFileName(
  ownerId: number,
  fileType: string,
  fileId?: number,
  signed = true
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
  return `${fileType}_${signed ? "" : "unsign_"}${fileId || 'doc'}_${ownerId}_${dt.getFullYear()}_${dt.getMonth()}_${dt.getDay()}_${dt.getHours()}_${dt.getMinutes()}_${dt.getSeconds()}.${fileExt}`;
}

export async function CreateFileNameDBNote(
  ownerId: number,
  fileType: string,
  ready_id: number,
  signed = true,
  save = false,
): Promise<{ id: number; name: string }> {
  const fileId = ready_id || await GetNewFileId();

  const newFileName = createFileName(ownerId, fileType, fileId, signed);
  const fileAddQuery = `
   INSERT INTO public.user_files(
	id, file_name, file_type, owner_id, is_deleted)
	VALUES ($1, $2, $3, $4, false) ;
   `;
  try {
    if (save) await pool.query(fileAddQuery, [fileId, newFileName, fileType, ownerId]);
    return { id: fileId, name: newFileName };
  } catch (e: any) {
    console.log(e.message);
    return { id: 0, name: "" };
  }
}

export async function deleteFile (fileId: number) {
  const getFileQuery = `SELECT * FROM user_files WHERE id = ${fileId};`;
  const deleteFileQuery = `DELETE FROM user_files WHERE id = ${fileId};`;
  const clearHistoryQuery = `DELETE FROM order_history WHERE ${fileId} = ANY(document_ids);`;
  return new Promise(async (resolve, reject) => {
    const fileData: FileDownloadData[] = await Q(getFileQuery, true) || [];
    if (fileData.length === 0) {
      reject('File not found');
      return;
    }
    const file = fileData[0];
    const fileName = `${rootFolder}${file.owner_id}/${file.file_name}`;

    await Q(deleteFileQuery, false);
    await Q(clearHistoryQuery, false);

    try {
      await deleteFiles([fileName]);
      resolve(true);
      return;
    } catch (e) {
      console.log(e);
      reject("Failed to delete file, unknown error");
      return;
    } 

  })
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
): Promise<FileDownloadData[]> {
  const files: FileDownloadData[] = [];
  const query = `SELECT * FROM "user_files" WHERE "owner_id" = $1;`;

  try {
    const result = await pool.query(query, [userId]);
    result.rows.forEach((row) => {
      files.push(row);
    });
  } catch (e: any) {
    console.log(e.message);
  }

  return files;
}

export async function getDownloadById(
  fileId: number
): Promise<FileDownloadData[]> {
  const files: FileDownloadData[] = [];
  const query = `SELECT * FROM "user_files" WHERE "id" = $1;`;

  try {
    const result = await pool.query(query, [fileId]);
    result.rows.forEach((row) => {
      files.push(row);
    });
  } catch (e: any) {
    console.log(e.message);
  }

  return files;
}

export async function deleteOldFiles(daysOld: number = 30): Promise<number> {
  let deletionCounter = 0;

  // UNIX timestamp: now - N days
  const limitTimestamp = Math.floor(Date.now() / 1000) - daysOld * 24 * 60 * 60;

  const idSelectQuery = `
    SELECT DISTINCT unnest(document_ids) AS document_id
    FROM order_history
    WHERE order_date < $1;
  `;

  try {
    const result = await pool.query(idSelectQuery, [limitTimestamp]);
    const documentIds = new Set<number>();

    for (const row of result.rows) {
      const id = Number(row.document_id);
      if (!isNaN(id)) {
        documentIds.add(id);
      }
    }

    for (const id of documentIds) {
      try {
        await deleteFile(id);
        deletionCounter++;
      } catch (err) {
        console.log(`Failed to delete file with id ${id}:`, err);
      }
    }
  } catch (e: any) {
    console.log("Error during old file deletion:", e.message);
  }

  return deletionCounter;
}
