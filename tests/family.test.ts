import { describe, test, expect, afterAll } from "vitest";
import { prisma } from "../lib/db";
import api from "../app/api/[[...route]]/route";

describe("Family routes", async () => {
  const family = await prisma.family.findFirst();
  const familyId = family?.id || 0;
  const orderId = family?.orderId || 0;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("GET /api/family/:familyId returns 404 for a non-existent family", async () => {
    const res = await api.request("/api/family/99999999");
    expect(res.status).toBe(404);
  });

  test("GET /api/family/:familyId returns the family", async () => {
    const res = await api.request(`/api/family/${familyId}`);
    expect(res.status).toBe(200);
    const fam = await res.json();
    expect(fam.id).toBe(familyId);
  });

  test("GET /api/family/ returns the families by order id", async () => {
    const query = new URLSearchParams({ orderId: String(orderId) });
    const res = await api.request(`/api/family?${query}`);

    expect(res.status).toBe(200);
    const fams = await res.json();

    expect(fams).toContainEqual({ id: familyId, name: family?.name || '' });
  });
});