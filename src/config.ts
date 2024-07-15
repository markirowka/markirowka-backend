import dotenv from "dotenv";
dotenv.config();

export const orderSendTo = process.env.SEND_TO_EMAIL;

console.log("From env: ", process.env, orderSendTo)

export const frontend_url = "https://websiteonlytest.ru";
export const amount_perpage = 5;