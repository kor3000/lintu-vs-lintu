import { describe, test, expect, afterAll } from "vitest";
import { prisma } from "../lib/db";
import api from "../app/api/[[...route]]/route";
import { deleteIfExists } from "../app/common/utils";

const speciesName = 'TEST-Mythicus pebet';

describe("Species routes", async () => {
  let speciesId: number;
  const genus = await prisma.genus.findFirst();

  afterAll(async () => {
    await deleteIfExists(prisma.species, { scientificName: speciesName });
    await prisma.$disconnect();
  });

  describe("POST", async () => {
    test("POST api/species creates a species", async () => {
      const res = await api.request("/api/species", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scientificName: speciesName,
          genusId: genus?.id,
          data: { range: "everywhere" },
        }),
      });

      console.log('res:', res);
      expect(res.status).toBe(201);
      const body = await res.json();
      speciesId = body.id;
      expect(typeof speciesId).toBe("number");
    });
  });

  describe("GET", async () => {
    test("GET api/species returns selected species by ids", async () => {
      const query = new URLSearchParams({ ids: String(speciesId), languageCode: "en" });
      const res = await api.request(`/api/species?${query}`);

      expect(res.status).toBe(200);
      const results = await res.json();
      expect(results).toEqual([
        expect.objectContaining({
          id: speciesId,
          scientificName: speciesName,
          size: expect.any(Object),
          images: [],
          genus: expect.objectContaining({
            name: expect.any(String),
            family: expect.objectContaining({
              name: expect.any(String),
              order: expect.objectContaining({ name: expect.any(String) }),
            }),
          }),
          names: [],
        }),
      ]);
    });

    test("GET api/species/search returns localized search options", async () => {
      const query = new URLSearchParams({ searchValue: speciesName, languageCode: "en" });
      const res = await api.request(`/api/species/search?${query}`);

      expect(res.status).toBe(200);
      const results = await res.json();
      expect(results).toEqual([
        expect.objectContaining({
          id: speciesId,
          scientificName: speciesName,
          names: [],
          genus: expect.objectContaining({
            name: expect.any(String),
            family: expect.objectContaining({ id: expect.any(Number) }),
          }),
        }),
      ]);
    });

    test("GET api/species/:speciesId returns 404 for a non-existent species", async () => {
      const res = await api.request("/api/species/99999999");
      expect(res.status).toBe(404);
    });

    test("GET api/species/:speciesId returns the species", async () => {
      const res = await api.request(`/api/species/${speciesId}`);
      expect(res.status).toBe(200);
      const species = await res.json();
      expect(species.id).toBe(speciesId);
    });
  });

  describe("PUT", async () => {
    test("PUT api/species/:speciesId fails with 400 for an invalid id", async () => {
      const res = await api.request("/api/species/aa22", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scientificName: "x" }),
      });
      expect(res.status).toBe(400);
    });

    test("PUT api/species/:speciesId updates the species", async () => {
      const res = await api.request(`/api/species/${speciesId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avibaseId: "test-ABCD"
        }),
      });
      expect(res.status).toBe(200);
      const species = await res.json();
      expect(species.avibaseId).toBe("test-ABCD");
    });
  });

  describe("DELETE", async () => {
    test("DELETE api/species/:speciesId fails with 400 for an invalid id", async () => {
      const res = await api.request("/api/species/aa22", { method: "DELETE" });
      expect(res.status).toBe(400);
    });

    test("DELETE api/species/:speciesId deletes the species", async () => {
      const res = await api.request(`/api/species/${speciesId}`, { method: "DELETE" });
      expect(res.status).toBe(204);
    });
  });
});