import { CreateUser, User } from "./models";
import { CreateDB } from "./models/createDb";

const defaultAdmin: User = {
    email: 'admin@example.com',
    phone: '1111111111',
    password: 'default',
    full_name: 'master_admin',
    isConfirmed: true,
    inn: 0,
    user_role: 'ADMIN'
}

async function FillDatabase () {
    await CreateDB();
    const startUser = await CreateUser(defaultAdmin);

    if (startUser === null) {
        console.log("Default admin creation failed");
    } else {
        console.log("Default admin is set up id: ", startUser);
    }
}

FillDatabase ();
