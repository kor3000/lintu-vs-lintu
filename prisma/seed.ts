import "dotenv/config";
import prisma from "../client";
import { parseArgs } from "node:util";
import { performance } from 'perf_hooks';

import { readAviList, readJsonFile, determineStartAndEnd, type ParseStatistics } from "./seed_functions";

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
* @argument {keyof typeof fileCue} startAt - Start seeding at specified file; skips prior files
* @argument {keyof typeof fileCue} endAt - End seeding at specified file; skips following files
* @argument {string} limitLangs - Comma-separated list of language codes for which you want bird species common name. E.g., 'en,fi'.
*                                 Limiting languages speeds up seeding. By default all available common name translations are parsed.
* 
* Files are parsed in the following order:
* 1. AviList ('avilist')
* 2. Wikidata ('wikidata')
* 3. INaturalist ('inat')
* 4. Wikipedia ('wikipedia')
* 5. Macaulay ('macaulay')
*/

const fileCue = {
  'avilist': 0,
  'wikidata': 1,
  'inat': 2,
  'wikipedia': 3,
  'macaulay': 4
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

const coverageStr = (count: number | undefined, firstItem: number, lastItem?: number) => {
  if (!count || firstItem > count - 1) return 'N/A';

  const { startAt, endAt } = determineStartAndEnd(count, firstItem, lastItem);
  const covered = (startAt === null) ? 0 : endAt - startAt + 1;
  const percent = Math.round(covered / count * 10000) / 100;
  return `${percent} % (${covered}/${count} items)`;
};

const argToInt = (arg: string | undefined, type: string) => {
  if (!arg) return;

  try {
    const argInt = Number(arg);
    return argInt;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    switch (type) {
      case 'from':
        console.log('No "from" argument received. Starting parsing from the first item in each list');
        break;
      case 'to':
        console.log('No "to" argument received. End parsing at the last item in each list');
        break;
    }
  }
};

const clearDatabase = async () => {
  console.log('No startAt argument parsed. Running seeding from the beginning.');
  console.log('\n\n===== CLEAR DATABASE =====\n\n');
  await prisma.$transaction([
    prisma.species.deleteMany(),
    prisma.genus.deleteMany(),
    prisma.family.deleteMany(),
    prisma.order.deleteMany(),
    prisma.language.deleteMany(),
    prisma.resource.deleteMany(),
  ]);
};

interface SeedStatistics extends ParseStatistics {
 startTime: number;
 endTime: number;
};

type SeedData = { [key: string]: SeedStatistics | undefined };

async function main() {
  const startTime = performance.now();

  // Handle args
  const {
    values: { from, to, startAt, endAt, limitLangs },
  } = parseArgs({ options });

  const firstItem = argToInt(from, 'from') || 0;
  const lastItem = argToInt(to, 'to');
  const startAtInt = (startAt && startAt in fileCue) ? fileCue[startAt as keyof typeof fileCue] : 0;
  const endAtInt = (endAt && endAt in fileCue) ? fileCue[endAt as keyof typeof fileCue] : 999;
  const langs = limitLangs ? limitLangs.toLowerCase().split(',') : null;

  if (langs) {
    console.log('Limiting bird species common name parsing to the following languages:', langs.join(', '));
  } else {
    console.log('No "limitLangs" argument received. Parsing bird common names in all available languages.');
  }

  console.log('\n\n===== BEGIN SEEDING =====\n\n');
  const stats: SeedData = {};

  // Parse files
  const handleFile =  async (
    key: keyof typeof fileCue,
  ) => {
    const cue = fileCue[key]
    if (startAtInt > cue || endAtInt < cue) {
      console.warn(`\n\n===== SKIPPING STEP ${cue + 1}: Read ${key} data =====\n`);
      return;
    }
    
    const startTime = performance.now();
    const isAvilist = key === 'avilist';
    if (isAvilist) await clearDatabase();
    console.log(`\n\n===== SEED STEP ${cue + 1}: Read ${key} data =====\n\n`);
    const fileStats = isAvilist
      ? await readAviList(firstItem, lastItem) || {}
      : await readJsonFile(`${key}_data`, langs, firstItem, lastItem) || {};
    const endTime = performance.now();
    stats[key] = { ...fileStats, startTime, endTime }
  }

  await handleFile('avilist');
  await handleFile('wikidata');
  await handleFile('inat');
  await handleFile('wikipedia');
  await handleFile('macaulay');

  const endTime = performance.now();

  // Log command & args
  if (startAt || endAt || from || to || limitLangs) {
    const startAtStr = startAt ? ` --startAt ${startAt}` : '';
    const endAtStr = endAt ? ` --endAt ${endAt}` : '';
    const fromStr  = from ? ` --from ${from}` : '';
    const toStr = to ? ` --to ${to}` : '';
    const langStr = limitLangs ? ` --limitLangs ${limitLangs}` : '';
    console.log(`\n\nFinished running command:\n    npx prisma db seed --${startAtStr}${endAtStr}${fromStr}${toStr}${langStr}\n`);
  } else {
    console.log('\n\nFinished running command:\n    npx prisma db seed\n');
  }

  let reportMissing = '';
  const tableStr: string[] = [];

  // Prepare report strings for logging
  for (const key of Object.keys(stats)) {
    const data = stats[key];
    if (!data) continue;

    const label = `${key}${' '.repeat(13 - key.length)}`;
    const dur = durationStr(data.endTime - data.startTime); 
    const coverage = coverageStr(data.itemCount, firstItem, lastItem);
    tableStr.push(`${label}${dur}${' '.repeat(24 - dur.length)}${coverage}`);
    
    if (data.missingSpecies && data.missingSpecies.length > 0) {
      reportMissing = `${reportMissing}\n  ${key}: ${data.missingSpecies.join(', ')}`;
    }
  }

  // Log report
  if (reportMissing !== '') {
    console.warn(`Data not persisted for the following species missing from database:\n${reportMissing}\n`);
  }

  console.log(`Total time elapsed: ${durationStr(endTime - startTime)}`);
  console.log(`\nFile         Time                    Coverage\n${'-'.repeat(62)}`);
  console.log(tableStr.join('\n'));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
