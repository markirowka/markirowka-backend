import { initAdminRoutes } from "./admin";
import { initCommonRoutes } from "./common";
import { initFileRoutes } from "./files";
import { initUserRoutes } from "./user";

export function initRoutes() {
    initCommonRoutes();
    initUserRoutes();
    initAdminRoutes();
    initFileRoutes();
}