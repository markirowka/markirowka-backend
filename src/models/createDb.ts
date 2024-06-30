import { User } from ".";
import pool from "./db";

const creationQuery = `
CREATE TABLE IF NOT EXISTS app_users (
    id serial PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password varchar(256),
    isConfirmed boolean,
    full_name varchar(256) NOT NULL,
    ceo varchar(64),
    ceo_full varchar(128),
    ceo_base varchar(128),
    ceo_genitive varchar(64),
    law_address varchar(256),
    bank_account varchar(32),
    corr_account varchar(32),
    bank_code varchar(32),
    bank_name varchar(32),
    inn BIGINT UNIQUE,
    cargo_recevier varchar(256),
    cargo_city varchar(64),
    user_role varchar(32)
 );
 
 
CREATE TABLE IF NOT EXISTS user_files (
    id serial PRIMARY KEY,
    file_name varchar(256),
    file_type varchar(64),
    owner_id Integer
 );

CREATE TABLE IF NOT EXISTS order_history (
    id serial PRIMARY KEY,
    order_date Integer,
    order_status varchar(64),
    document_ids integer[]
 );

CREATE TABLE IF NOT EXISTS menu_items (
    id serial PRIMARY KEY,
    name varchar(64),
    url varchar(256)
 );

CREATE TABLE IF NOT EXISTS articles (
    id serial PRIMARY KEY,
    url_name varchar(64),
    title varchar(128),
    content TEXT
 );
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