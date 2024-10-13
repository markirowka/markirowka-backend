import { Q } from "./db";

export interface UserStatsItem {
    url: string;
    readTime?: number;
    is_read?: boolean;
}

export async function getUserReadStats (userId: number): Promise<UserStatsItem[]> {
    const query = `
    SELECT st.date_read >= a.date_updated AS is_read, a.url_name as url
    FROM articles as a, user_read_stats as st 
    WHERE a.id = st.article_id AND st.user_id = $1;`;
    const result: UserStatsItem[] | null = await Q(query, true, [userId]);
    return result || [];
}

export async function setUserArticleStats (userId: number, articleId: number): Promise<boolean> {
    const query = `
     INSERT INTO user_read_stats (user_id, article_id, date_read)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, article_id)
     DO UPDATE SET date_read = NOW();
    ` 
    const result = await Q(query, false, [userId, articleId])
    return !!result;
}