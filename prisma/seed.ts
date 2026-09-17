import prisma from "../client";
import { parseArgs } from "node:util";
import { performance } from 'perf_hooks';

import { readAviList, readJsonFile } from "./seed_functions";

/**
* Run seed function with:
*   npx prisma db seed
* Add args after -- and prefix them with --, e.g.:
*   npx prisma db seed -- --limit 1000
* 
* Accepted args:
* @argument {number} limit - Cap for number of species parsed
* @argument {'inat'} startat - Start seeding at specified file; skips prior files
* @argument {'avilist'|'inat'} endat - End seeding at specified file; skips following files
* 
* Files are parsed in the following order:
* 1. AviList ('avilist')
* 2. INaturalist ('inat')
*/

const startAtToInt = {
  'avilist': 0,
  'inat': 1
};

const options = {
  limit: { type: "string" },
  startat: { type: "string" },
  endat: { type: "string" }
} as const;

const durationStr = (ms: number) => {
  const time = new Date(ms);

  return `${time.getMinutes()} min ${time.getSeconds()} s (${time.getMilliseconds()} ms)`;
}


async function main() {
  const startTime = performance.now();
  const {
    values: { limit, startat, endat },
  } = parseArgs({ options });

  let useCap = 0;
  
  try {
    if (limit) useCap = parseInt(limit);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.log('No limit argument parsed. Seeding will not be capped.');
  }

  let startAtInt = 0;
  let endAtInt = 0;

  if (startat && startat in startAtToInt) {
    startAtInt = startAtToInt[startat as keyof typeof startAtToInt];
  }

  if (endat && endat in startAtToInt) {
    endAtInt = startAtToInt[endat as keyof typeof startAtToInt];
  }

  const doAvilist = startAtInt === 0;
  const doInat = startAtInt <= 1 && endAtInt >= 1;

  let aviStart, aviEnd, iNatStart, iNatEnd: number | undefined;
  aviStart = aviEnd = iNatStart = iNatEnd = 0;

  if (doAvilist) {
    aviStart = performance.now();
    // Only clear database if starting from the beginning
    console.log('\n\n===== CLEAR DATABASE =====\n\n');
    await prisma.$transaction([
      prisma.species.deleteMany(),
      prisma.genus.deleteMany(),
      prisma.family.deleteMany(),
      prisma.order.deleteMany(),
      prisma.language.deleteMany(),
      prisma.resource.deleteMany(),
    ]);

    console.log('No startat argument parsed. Running seeding from the beginning.');
    console.log('\n\n===== SEED STEP 1: Read AviList =====\n\n');
    await readAviList(useCap);
    aviEnd = performance.now();
  } else {
    console.warn('\n\n===== SKIPPING STEP 1: Read AviList =====\n\n');
  }

  if (doInat) {
    iNatStart = performance.now();
    console.log('\n\n===== SEED STEP 2: Read INat data =====\n\n');
    await readJsonFile('inat_data', useCap);
    iNatEnd = performance.now();
  } else {
    console.warn('\n\n===== SKIPPING STEP 2: Read INat data =====\n\n');
  }

  const endTime = performance.now();

  console.log('\n\nAll seed operations run')
  console.log(`Total time elapsed: ${durationStr(endTime - startTime)}`);
  console.log('\nTime per operation:\n-----------');
  console.log(`AviList:     ${durationStr(aviEnd - aviStart)}`);
  console.log(`INat:        ${durationStr(iNatEnd - iNatStart)}`);

}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
