import {
  Family,
  Genus,
  Image,
  Language,
  Order,
  Resource,
  ResourceUrl,
  Species,
  SpeciesName,
  PrismaClient,
} from "@/generated/prisma/client";
import { ModelName } from "@/generated/prisma/internal/prismaNamespace";

type Model =
  | Family
  | Genus
  | Image
  | Language
  | Order
  | Resource
  | ResourceUrl
  | Species
  | SpeciesName;
type PrismaModel = PrismaClient[Uncapitalize<ModelName>];
type ModelArgs = { [key:string]: unknown; }
type WhereFunc = (args: { where: ModelArgs }) => Promise<Model | null>;
type DataFunc = (args: { data: ModelArgs }) => Promise<Model>;

export const capitalize = <T extends string>(s: T) =>
  (s[0].toUpperCase() + s.slice(1)) as Capitalize<typeof s>;

// Find the first matching instance in database or create a new instance
export const firstOrCreate = async (model: PrismaModel, args: ModelArgs, createProps: ModelArgs = {}) => {
  const findFirst = model.findFirst as unknown as WhereFunc;
  const create = model.create as unknown as DataFunc;

  const found = await findFirst({ where: args});
  if (found) return found;

  return await create({ data: { ...args, ...createProps } });
};

// If instance exists in the database, delete it
export const deleteIfExists = async (model: PrismaModel, args: ModelArgs) => {
  const findFirst = model.findFirst as unknown as WhereFunc;

  const found = await findFirst({ where: args});
  if (!found) return;

  // console.log('DELETING', args);
  const deleteFromDB = model.delete as unknown as WhereFunc;
  await deleteFromDB({ where: args});
};