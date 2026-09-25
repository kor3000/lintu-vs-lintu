import prisma from "../client";
import { parseArgs } from "node:util";
import { performance } from 'perf_hooks';

import { readAviList, readJsonFile } from "./seed_functions";

/**
* Run seed function with:
*   npx prisma db seed
* Add args after -- and prefix them with --, e.g.:
*   npx prisma db seed -- --from 1000
* 
* It is highly recommended that AviList is parsed in full before proceeding to the other files as it serves as the basis of species taxonomy
* 
* Accepted args:
* @argument {number} from - Item number from which to start parsing; 0 to n
* @argument {number} to - Item number at which to stop parsing; 0 to n 
* @argument {'wikidata'|'inat'} startat - Start seeding at specified file; skips prior files
* @argument {'avilist'|'wikidata'|'inat'} endat - End seeding at specified file; skips following files
* 
* Files are parsed in the following order:
* 1. AviList ('avilist')
* 2. Wikidata ('wikidata')
* 3. INaturalist ('inat')
*/

const startAtToInt = {
  'avilist': 0,
  'wikidata': 1,
  'inat': 2
};

const options = {
  from: { type: "string" },
  to: { type: "string" },
  startat: { type: "string" },
  endat: { type: "string" }
} as const;

const durationStr = (ms: number) => {
  const time = new Date(ms);

  return `${time.getMinutes()} min ${time.getSeconds()} s (${time.getMilliseconds()} ms)`;
};

const argToInt = (arg: string | undefined, type: string) => {
  if (!arg) return;

  let argInt: number | undefined;
  try {
    argInt = Number(arg);
    return argInt;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    switch (type) {
      case ('from'):
        console.log('No "from" argument received. Starting parsing from the first item in each list');
    }
    console.log(`No '${type}' argument parsed.`);
  }
};


async function main() {
  const startTime = performance.now();
  const {
    values: { from, to, startat, endat },
  } = parseArgs({ options });

  const firstItem = argToInt(from, 'from') || 0;
  const lastItem = argToInt(to, 'to');

  let startAtInt = 0;
  let endAtInt = 0;

  if (startat && startat in startAtToInt) {
    startAtInt = startAtToInt[startat as keyof typeof startAtToInt];
  }

  if (endat && endat in startAtToInt) {
    endAtInt = startAtToInt[endat as keyof typeof startAtToInt];
  }

  const doAvilist = startAtInt === 0;
  const doWikidata = startAtInt <= 1 && endAtInt >= 1;
  const doInat = startAtInt <= 2 && endAtInt >= 2;

  let aviStart, aviEnd, wikidataStart, wikidataEnd, iNatStart, iNatEnd: number | undefined;
  aviStart = aviEnd = wikidataStart = wikidataEnd = iNatStart = iNatEnd = 0;

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
    await readAviList(firstItem, lastItem);
    aviEnd = performance.now();
  } else {
    console.warn('\n\n===== SKIPPING STEP 1: Read AviList =====\n\n');
  }

  if (doWikidata) {
    wikidataStart = performance.now();
    console.log('\n\n===== SEED STEP 2: Read Wikidata data =====\n\n');
    await readJsonFile('wikidata_data', firstItem, lastItem);
    wikidataEnd = performance.now();
  } else {
    console.warn('\n\n===== SKIPPING STEP 2: Read Wikidata data =====\n\n');
  }

  if (doInat) {
    iNatStart = performance.now();
    console.log('\n\n===== SEED STEP 3: Read INat data =====\n\n');
    await readJsonFile('inat_data', firstItem, lastItem);
    iNatEnd = performance.now();
  } else {
    console.warn('\n\n===== SKIPPING STEP 3: Read INat data =====\n\n');
  }

  const endTime = performance.now();

  console.log('\n\nAll seed operations run')
  console.log(`Total time elapsed: ${durationStr(endTime - startTime)}`);
  console.log('\nTime per operation:\n-----------');
  console.log(`AviList:     ${durationStr(aviEnd - aviStart)}`);
  console.log(`Wikidata:    ${durationStr(wikidataEnd - wikidataStart)}`);
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
