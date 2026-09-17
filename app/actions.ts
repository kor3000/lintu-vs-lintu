"use server";

import { prisma } from "../lib/db";

export const getOrderOptions = async () => {
  return prisma.order.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: [
      { name: "asc" }
    ],
  });
};

export const getFamilyOptions = async (orderId: number) => {
  return prisma.family.findMany({
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
};

const getRelationFilter = (orderId?: number, familyId?: number) => {
  if (familyId !== undefined) {
    return { genus: { familyId } };
  }
  if (orderId !== undefined) {
    return { genus: { family: { orderId } } };
  }

  return {};
}

export const getSearchOptions = async (
  searchValue: string,
  languageCode: string,
  orderId?: number,
  familyId?: number
) => {
  if (searchValue.trim() === "") return [];

  return prisma.species.findMany({
    where: {
      OR: [
        {
          scientificName: {
            contains: searchValue.trim(),
            mode: "insensitive",
          }
        },
        {
          names: {
            some: {
              language: { code: languageCode },
              name: {
                contains: searchValue.trim(),
                mode: "insensitive",
              },
            },
          },
        },
      ],
      ...(getRelationFilter(orderId, familyId))
    },
    select: {
      id: true,
      scientificName: true,
      names: {
        where: {
          language: { code: languageCode }
        },
        select: {
          name: true
        },
        take: 1
      },
      genus: {
        select: {
          name: true,
          family: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: { scientificName: "asc" },
  });
};

export const getSpeciesByIds = async (ids: number[], languageCode: string) => {
  return prisma.species.findMany({
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
        where: {
          language: { code: languageCode },
        },
        select: { name: true },
        take: 1,
      },
    },
  });
};