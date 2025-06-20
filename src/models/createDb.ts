import { User } from ".";
import pool from "./db";

const creationQuery = `
CREATE TABLE IF NOT EXISTS app_users (
    id serial PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password varchar(256),
    isConfirmed boolean,
    full_name varchar(256) NOT NULL,
    phone varchar(64),
    ceo varchar(64),
    ceo_full varchar(128),
    ceo_base varchar(128),
    ceo_genitive varchar(64),
    law_address varchar(256),
    bank_account varchar(32),
    corr_account varchar(32),
    bank_code varchar(32),
    bank_name varchar(32),
    inn BIGINT,
    cargo_recevier varchar(256),
    cargo_city varchar(64),
    user_role varchar(32),
    gln varchar(64)
 );
 
 
CREATE TABLE IF NOT EXISTS user_files (
    id serial PRIMARY KEY,
    file_name varchar(256),
    file_type varchar(64),
    owner_id Integer,
    date_created Boolean,
    is_deleted Boolean
 );

CREATE TABLE IF NOT EXISTS order_history (
    id serial PRIMARY KEY,
    user_id Integer,
    order_date Integer,
    paid_date Integer,
    order_status varchar(64),
    order_status_id integer,
    has_specify boolean,
    document_ids integer[]
 );

CREATE TABLE IF NOT EXISTS order_statuses (
   id serial PRIMARY KEY,
   name varchar(64),
);
 
CREATE TABLE IF NOT EXISTS menu_items (
    id serial PRIMARY KEY,
    name varchar(64),
    url varchar(256),
    sort_index Integer
 );

CREATE TABLE IF NOT EXISTS articles (
    id serial PRIMARY KEY,
    url_name varchar(64) NOT NULL UNIQUE,
    title varchar(128),
    content TEXT,
    date_updated TIMESTAMP 
 );

CREATE TABLE IF NOT EXISTS user_read_stats (
    id serial PRIMARY KEY,
    user_id integer,
    article_id integer,
    date_read TIMESTAMP,
    UNIQUE (user_id, article_id)
 );

CREATE TABLE IF NOT EXISTS content_blocks (
    id serial PRIMARY KEY,
    article_id integer,
    content TEXT
);

CREATE TABLE IF NOT EXISTS good_categories (
   id serial PRIMARY KEY,
   name varchar(64),
   metrik varchar(32),
   okei_code varchar(32)
);

INSERT INTO good_categories (id, name, metrik, okei_code) VALUES
(1, 'Одежда', 'шт.', '796'),
(2, 'Обувь', 'пара', '715'),
(3, 'Косметика', 'мл', '111'),
(4, 'Головные уборы', 'шт.', '796'),
(5, 'Изделия-штучные', 'шт.', '796'),
(6, 'Ткани', 'м', '006'),
(7, 'Духи', 'мл', '111'),
(8, 'Автозапчасти', 'шт.', '796'),
(9, 'Сумки', 'шт.', '796');

SELECT setval(pg_get_serial_sequence('good_categories', 'id'), max(id)) 
FROM good_categories;
`

const cleaningQuery = `
    TRUNCATE TABLE "app_users";
    TRUNCATE TABLE "user_files";
`

export async function CreateDB (): Promise<boolean> {
    try {
        await pool.query(creationQuery);
        return true
    } catch (e: any) {
        console.log(e.message);
        return false;
    }
}

export async function CleanDB (): Promise<boolean> {
    try {
        await pool.query(cleaningQuery);
        return true
    } catch (e: any) {
        console.log(e.message);
        return false;
    }
}