import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../../../lib/db";

const order = new Hono<AppEnv>();

const orderIdParam = z.object({
  orderId: z.coerce.number().int()
});

order.get("/order/:orderId", zValidator("param", orderIdParam), async (c) => {
  const prisma = c.get("prisma");
  const { orderId } = c.req.valid("param");

  const o = await prisma.order.findUnique({ where: { id: orderId } });

  if (!o) {
    return c.body(null, 404);
  }

  return c.json(o, 200);
});

order.get("/orders", async (c) => {
  const prisma = c.get("prisma");

  const o = await prisma.order.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: [
      { name: "asc" }
    ]
  });

  if (!o) {
    return c.body(null, 404);
  }

  return c.json(o, 200);
});

export default order;
