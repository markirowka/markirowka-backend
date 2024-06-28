import fs from 'fs';
import path from 'path';
import pool from "./db";

export const rootFolder = process.env.FILE_ROOT_FOLDER || "files/"

export interface itemData {
    code?: number;
    tnved?: number;
    k3?: number;
    name?: string;
    tradeMark?: string;
    modelNameType?: string;
    modelNameStr?: string;
    type?: string;
    color?: string;
    size?: number;
    material?: string;
    tnvedCode?: number;
    cardStatus?: string;
    cardResult?: string;
}

export interface itamDataShoes {
    
}


export const sampleItem: itemData = {
    code: 0,
    tnved: 1,
    k3: 1,
    name: 'Sample Name',
    tradeMark: 'Sample TradeMark',
    modelNameType:'',
    modelNameStr: '',
    type: 'Sample Type',
    color: 'Sample Color',
    size: 42,
    material: 'Sample Material',
    tnvedCode: 123456,
    cardStatus: 'Active',
    cardResult: 'Success'
}

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

export async function GetNewFileId (): Promise<number> {
    const query = `SELECT max("id") FROM "user_files";`
    try {
        const result = await pool.query(query);
        console.log("File selection result: ", result.rows)
        if (result.rows.length === 0) {
            return 1;
        }
        return result.rows[0].max ? Number(result.rows[0].max ) + 1 : 1;
      } catch (e: any) {
        console.log(e.message);
        return 1;
      }
}

export async function CreateFileNameDBNote (ownerId: number, fileType: string): Promise<{id: number; name: string}> {
   const fileId = await GetNewFileId();
   const dt = new Date();
   const fileExt = fileType === 'specify' ? 'xlsx' : 'pdf';
   
   const newFileName =  `${fileType}_${fileId}_${ownerId}_${dt.getFullYear()}_${dt.getMonth()}_${dt.getDay()}_${dt.getHours()}_${dt.getMinutes()}_${dt.getSeconds()}.${fileExt}`
   const fileAddQuery = `
   INSERT INTO public.user_files(
	file_name, file_type, owner_id)
	VALUES ('${newFileName}', '${fileType}', ${ownerId});
   `
   try {
    const result = await pool.query(fileAddQuery);
    return {id: fileId, name: newFileName}
  } catch (e: any) {
    console.log(e.message);
    return {id: 0, name: ""};
  }
}

export async function CheckAndCreateOwnerFolder (ownerId: number) : Promise<boolean> {
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
}export async function GetDownloads (userId: number): Promise<fileDownloadData[]> {
    const files: fileDownloadData[] = []
    const query = `SELECT * FROM "user_files" WHERE "owner_id" = ${userId};`;
    
    try {
        const result = await pool.query(query);
        result.rows.forEach((row) => {
            files.push(row)
        })
    } catch (e: any) {
        console.log(e.message);
    }

    return files;
}