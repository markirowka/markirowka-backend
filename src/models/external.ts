import fetch from "node-fetch";

export async function validateUnp(unp: number | string): Promise<boolean> {
    const url = `http://grp.nalog.gov.by/api/grp-public/data?unp=${unp}&charset=UTF-8&type=json`;

    try {
        const res = await fetch(url);
        return res.ok;
    } catch (e) {
        console.error("Ошибка при запросе к API:", e);
        return false;
    }
}