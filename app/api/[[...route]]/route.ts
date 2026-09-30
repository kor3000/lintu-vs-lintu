import { Hono } from "hono";
import { handle } from '@hono/vercel'
import { withPrisma, type AppEnv } from "../../../lib/db";
import status from "./status";
import species from "./species";
import family from "./family";
import order from "./order";

const api = new Hono<AppEnv>().basePath('/api');

api.use("*", withPrisma);

api.route("/", status);
api.route("/", species);
api.route("/", family);
api.route("/", order);

export const GET = handle(api)
export const POST = handle(api)
export const PUT = handle(api)
export const DELETE = handle(api)

export default api;