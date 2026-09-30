import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../../../lib/db";

const family = new Hono<AppEnv>();

const familyIdParam = z.object({
  familyId: z.coerce.number().int()
});

family.get("/family/:familyId", zValidator("param", familyIdParam), async (c) => {
  const prisma = c.get("prisma");
  const { familyId } = c.req.valid("param");

  const f = await prisma.family.findUnique({ where: { id: familyId } });

  if (!f) {
    return c.body(null, 404);
  }

  return c.json(f, 200);
});

const familyOrderIdParam = z.object({
  orderId: z.coerce.number().int()
});

family.get("/family", zValidator("query", familyOrderIdParam), async (c) => {
  const prisma = c.get("prisma");
  const { orderId } = c.req.valid("query");

  const results = await prisma.family.findMany({
    where: {
      orderId
    },
    select: {
      id: true,
      name: true
    },
    orderBy: [
      { name: "asc" }
    ],
  });

  if (!results) {
    return c.body(null, 404);
  }

  return c.json(results, 200);
});

export default family;
