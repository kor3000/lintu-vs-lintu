import { describe, test, expect } from "vitest";
import api from "../app/api/[[...route]]/route";

describe("Status route", () => {
  test("GET /api returns 200 and { up: true }", async () => {
    const res = await api.request("/api");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ up: true });
  });
});