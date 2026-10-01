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
* It is highly recommended that AviList is parsed in full before proceeding to the other files as it serves as the basis of species taxonomy. E.g.:
*   npx prisma db seed -- --endAt avilist
* 
* Accepted args:
* @argument {number} from - Item number from which to start parsing; 0 to n
* @argument {number} to - Item number at which to stop parsing; 0 to n 
* @argument {'wikidata'|'inat'} startAt - Start seeding at specified file; skips prior files
* @argument {'avilist'|'wikidata'|'inat'} endAt - End seeding at specified file; skips following files
* @argument {string} limitLangs - Comma-separated list of language codes for which you want bird species common name. E.g., 'en,fi'.
*     Limiting languages speeds up seeding considerably. By default all available common name translations are parsed.
* 
* Files are parsed in the following order:
* 1. AviList ('avilist')
* 2. Wikidata ('wikidata')
* 3. INaturalist ('inat')
*/

const fileCue = {
  'avilist': 0,
  'wikidata': 1,
  'inat': 2
};

const options = {
  from: { type: "string" },
  to: { type: "string" },
  startAt: { type: "string" },
  endAt: { type: "string" },
  limitLangs: { type: "string" }
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
      case 'from':
        console.log('No "from" argument received. Starting parsing from the first item in each list');
        break;
      case 'to':
        console.log('No "to" argument received. End parsing from the last item in each list');
        break;
    }
  }
};


async function main() {
  const startTime = performance.now();
  const {
    values: { from, to, startAt, endAt, limitLangs },
  } = parseArgs({ options });

  const firstItem = argToInt(from, 'from') || 0;
  const lastItem = argToInt(to, 'to');

  let startAtInt = 0;
  let endAtInt = 999;

  if (startAt && startAt in fileCue) {
    startAtInt = fileCue[startAt as keyof typeof fileCue];
  }

  if (endAt && endAt in fileCue) {
    endAtInt = fileCue[endAt as keyof typeof fileCue];
  }

  let langs: string[] | null = null;

  console.log('\n\n===== BEGIN SEEDING =====\n\n');

  if (limitLangs) {
    langs = limitLangs.toLowerCase().split(',');
    console.log('Limiting bird species common name parsing to the following languages:', langs.join(', '));
  } else {
    console.log('No "limit" argument received. Parsing bird common names in all available languages.');
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

    console.log('No startAt argument parsed. Running seeding from the beginning.');
    console.log('\n\n===== SEED STEP 1: Read AviList =====\n\n');
    await readAviList(firstItem, lastItem);
    aviEnd = performance.now();
  } else {
    console.warn('\n\n===== SKIPPING STEP 1: Read AviList =====\n');
  }

  if (doWikidata) {
    wikidataStart = performance.now();
    console.log('\n\n===== SEED STEP 2: Read Wikidata data =====\n\n');
    await readJsonFile('wikidata_data', langs, firstItem, lastItem);
    wikidataEnd = performance.now();
  } else {
    console.warn('\n\n===== SKIPPING STEP 2: Read Wikidata data =====\n');
  }

  if (doInat) {
    iNatStart = performance.now();
    console.log('\n\n===== SEED STEP 3: Read INat data =====\n\n');
    await readJsonFile('inat_data', langs, firstItem, lastItem);
    iNatEnd = performance.now();
  } else {
    console.warn('\n\n===== SKIPPING STEP 3: Read INat data =====\n');
  }

  const endTime = performance.now();

  console.log('\n\nAll seed operations run');

  if (from || to) {
    const toString = to
      ? `to ${lastItem}`
      : 'through to the last items in the files';
    console.log(`Parsed items from ${firstItem} ${toString}`);
  }

  console.log(`Total time elapsed: ${durationStr(endTime - startTime)}`);
  console.log('\nTime per operation:\n-----------');
  if (doAvilist)
    console.log(`AviList:     ${durationStr(aviEnd - aviStart)}`);
  if (doWikidata)
    console.log(`Wikidata:    ${durationStr(wikidataEnd - wikidataStart)}`);
  if (doInat)
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
