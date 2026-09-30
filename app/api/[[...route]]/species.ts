import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../../../lib/db";
import { IUCNCategory } from "../../../generated/prisma/client"

const species = new Hono<AppEnv>();

const speciesSchema = z.object({
  scientificName: z.string(),
  genusId: z.number(),
  parentSpeciesId: z.number().optional(),
  protonym: z.string().optional(),
  IUCN: z.enum(IUCNCategory).optional(),
  cornellLabCode: z.string().optional(),
  avibaseId: z.string().optional(),
  inatId: z.number().optional(),
  ebirdCode: z.string().optional(),
  gbifId: z.number().optional(),
  ncbiId: z.number().optional(),
  birdlifeId: z.number().optional(),
  macaulayCode: z.string().optional(),
  data: z.object({
      range: z.string().optional(),
      type_locality: z.string().optional(),
      wikipedia_extract: z.string().optional(),
    })
    .optional(),
  size: z.object({
    length: z.object(),
    wingspan: z.object(),
    weight: z.object()
  }).optional()
});

//  images            Image[]
//  resourceUrls      ResourceUrl[]
//  names             SpeciesName[]
//  subspecies        Species[]           @relation("Subspecies")

const updateSpeciesSchema = speciesSchema.partial();

const speciesByIdsQuery = z.object({
  ids: z.string().min(1)
    .transform((ids) => ids.split(",").map((id) => Number(id.trim())))
    .pipe(z.array(z.number().int().positive()).min(1)),
  languageCode: z.string(),
});

species.get("/species", zValidator("query", speciesByIdsQuery), async (c) => {
  const prisma = c.get("prisma");
  const { ids, languageCode } = c.req.valid("query");

  const results = await prisma.species.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      scientificName: true,
      size: true,
      images: {
        select: {
          url: true,
          attribution: true,
          license: {
            select: {
              name: true,
              url: true,
            },
          },
        },
      },
      genus: {
        select: {
          name: true,
          family: {
            select: {
              name: true,
              order: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      names: {
        where: { language: { code: languageCode } },
        select: { name: true },
        take: 1,
      },
    },
  });

  return c.json(results);
});

const speciesSearchQuery = z.object({
  searchValue: z.string(),
  languageCode: z.string(),
  orderId: z.coerce.number().int().optional(),
  familyId: z.coerce.number().int().optional(),
});

species.get("/species/search", zValidator("query", speciesSearchQuery), async (c) => {
  const prisma = c.get("prisma");
  const { searchValue, languageCode, orderId, familyId } = c.req.valid("query");
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue === "") return c.json([]);

  const relationFilter = familyId !== undefined
    ? { genus: { familyId } }
    : orderId !== undefined
      ? { genus: { family: { orderId } } }
      : {};

  const results = await prisma.species.findMany({
    where: {
      OR: [
        {
          scientificName: {
            contains: trimmedSearchValue,
            mode: "insensitive",
          },
        },
        {
          names: {
            some: {
              language: { code: languageCode },
              name: {
                contains: trimmedSearchValue,
                mode: "insensitive",
              },
            },
          },
        },
      ],
      ...relationFilter,
    },
    select: {
      id: true,
      scientificName: true,
      names: {
        where: { language: { code: languageCode } },
        select: { name: true },
        take: 1,
      },
      genus: {
        select: {
          name: true,
          family: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: { scientificName: "asc" },
  });

  return c.json(results);
});

species.post("/species", zValidator("json", speciesSchema), async (c) => {
  const prisma = c.get("prisma");
  const data = c.req.valid("json");

  const createdSpecies = await prisma.species.create({
    data,
    select: { id: true },
  });

  return c.json(createdSpecies, 201);
});

const speciesIdParam = z.object({
  speciesId: z.coerce.number().int(),
});

species.get("/species/:speciesId", zValidator("param", speciesIdParam), async (c) => {
  const prisma = c.get("prisma");
  const { speciesId } = c.req.valid("param");

  const sp = await prisma.species.findUnique({ where: { id: speciesId } });

  if (!sp) {
    return c.body(null, 404);
  }

  return c.json(sp, 200);
});

species.put(
  "/species/:speciesId",
  zValidator("param", speciesIdParam),
  zValidator("json", updateSpeciesSchema),
  async (c) => {
    const prisma = c.get("prisma");
    const { speciesId } = c.req.valid("param");
    const data = c.req.valid("json");

    const updatedSpecies = await prisma.species.update({
      where: { id: speciesId },
      data,
    });

    return c.json(updatedSpecies, 200);
  },
);

species.delete("/species/:speciesId", zValidator("param", speciesIdParam), async (c) => {
  const prisma = c.get("prisma");
  const { speciesId } = c.req.valid("param");

  await prisma.species.delete({ where: { id: speciesId } });

  return c.body(null, 204);
});

export default species;