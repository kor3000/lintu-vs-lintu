import prisma from "../client";
import { parseArgs } from "node:util";

import { readAviList } from "./seed_functions";

const options = {
  limit: { type: "string" },
} as const;


async function main() {
  await prisma.$transaction([
    prisma.resourceUrl.deleteMany(),
    prisma.image.deleteMany(),
    prisma.speciesName.deleteMany(),
    prisma.species.deleteMany(),
    prisma.genus.deleteMany(),
    prisma.family.deleteMany(),
    prisma.order.deleteMany(),
    prisma.language.deleteMany(),
    prisma.resource.deleteMany(),
  ]);

  const {
    values: { limit },
  } = parseArgs({ options });

  let useCap = 0;

  try {
    if (limit) useCap = parseInt(limit);
  } catch (e) {
    console.log(`No limit argument parsed. Seeding will not be capped.`);
  }

  console.log('===== SEED STEP 1: Read AviList =====')
  await readAviList(useCap);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
