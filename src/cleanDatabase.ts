import { CreateUser, User } from "./models";
import { CleanDB, CreateDB } from "./models/createDb";


async function CleanDatabase () {
    await CleanDB();
    console.log("Database cleaning finished");
}

CleanDatabase ();
