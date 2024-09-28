import dotenv from "dotenv";
dotenv.config();

export const orderSendTo = process.env.SEND_TO_EMAIL;

export const frontend_url = "https://markirowka.ru";
export const amount_perpage = 5;

export const apiVersion = 112;