import { describe, test, expect, afterAll } from "vitest";
import { prisma } from "../lib/db";
import api from "../app/api/[[...route]]/route";

describe("Order routes", async () => {
  const order = await prisma.order.findFirst();
  const orderId = order?.id || 0;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("GET /api/order/:orderId returns 404 for a non-existent order", async () => {
    const res = await api.request("/api/order/99999999");
    expect(res.status).toBe(404);
  });

  test("GET /api/order/:orderId returns the order", async () => {
    const res = await api.request(`/api/order/${orderId}`);
    expect(res.status).toBe(200);
    const o = await res.json();
    expect(o.id).toBe(orderId);
  });

  test("GET /api/orders returns all orders", async () => {
    const res = await api.request("/api/orders");
    expect(res.status).toBe(200);
    const orders = await res.json();
    expect(orders).toContainEqual({ id: orderId, name: order?.name || '' });
  });
});