import { mockSpecies } from "../app/mock_data/mock_species";
import { readFile as readFileFromDisk } from "node:fs/promises";
import { basename } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

import locale from 'locale-codes';
import Papa from 'papaparse';

import { capitalize } from "@/app/common/utils";

type Language = {
  id: number;
  code: string;
  name: string | null;
}
type LangData =  {
  [key: string]: Language;
}

type ParsedCSVRow = {
  [key: string]: string;
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const parseCSV = (file) => {
  Papa.parse(file, {
    worker: true,
    header: true,
    step: (results: Papa.ParseStepResult<ParsedCSVRow>) => {
        console.log('Row:', results.data);
    },
    complete: (results: Papa.ParseResult<ParsedCSVRow[]>) => {
        console.log('CSV file successfully processed');
        console.log('Errors detected:', results.errors);
    },
    error: (error: Papa.ParseError) => {
        console.error('Error parsing CSV:', error);
    }
  });
}

 const readFile = async (path: string): Promise<File> => {
  const contents = await readFileFromDisk(path);
  const fileName = basename(path);

  if (typeof FileReader === "undefined") {
    return new File([new Uint8Array(contents)], fileName);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error(`Unable to read file: ${path}`));
        return;
      }

      resolve(new File([reader.result], fileName));
    };
    reader.onerror = () => reject(reader.error ?? new Error(`Unable to read file: ${path}`));
    reader.readAsArrayBuffer(new Blob([new Uint8Array(contents)]));
  });
}

const languageIds: LangData = {};

const getOrCreateLanguage = async (code: string) => {
  const lang = languageIds[code];
  if (lang) return lang;

  let name = locale.getByTag(code).local;
  const split = code.split('-');

  if (split.length == 2) {
    name = `${name} (${capitalize(split[1])})`;
  }

  const newLang = await prisma.language.create({
    data: { code, name }
  });

  languageIds[code] = newLang;

  return newLang;
}

async function main() {
  await prisma.$transaction([
    prisma.wikipediaExtract.deleteMany(),
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

  const languages = await Promise.all([
    getOrCreateLanguage('fi'),
    getOrCreateLanguage('en'),
  ]);
  const finnish = languages.find((language) => language.code === "fi")!;
  const english = languages.find((language) => language.code === "en")!;
  const imageResource = await prisma.resource.create({
    data: { name: "Wikimedia Commons" },
  });

  const taxonomy = new Map<string, number>();

  for (const species of mockSpecies) {
    const orderKey = `order:${species.order}`;
    let orderId = taxonomy.get(orderKey);
    if (!orderId) {
      const order = await prisma.order.create({ data: { name: species.order } });
      orderId = order.id;
      taxonomy.set(orderKey, orderId);
    }

    const familyKey = `family:${species.order}:${species.family}`;
    let familyId = taxonomy.get(familyKey);
    if (!familyId) {
      const family = await prisma.family.create({
        data: { name: species.family, orderId },
      });
      familyId = family.id;
      taxonomy.set(familyKey, familyId);
    }

    const genusKey = `genus:${species.family}:${species.genus}`;
    let genusId = taxonomy.get(genusKey);
    if (!genusId) {
      const genus = await prisma.genus.create({
        data: { name: species.genus, familyId },
      });
      genusId = genus.id;
      taxonomy.set(genusKey, genusId);
    }

    const createdSpecies = await prisma.species.create({
      data: {
        scientificName: `${species.genus} ${species.species}`,
        genusId,
        names: {
          create: [
            { languageId: finnish.id, name: species.name_fi },
            { languageId: english.id, name: species.name_eng },
          ],
        },
        images: {
          create: species.images.map((image) => ({
            url: image.url,
            license: "Wikimedia Commons",
            license_url: image.license_url,
            attribution: species.name_eng,
          })),
        },
      },
    });

    await prisma.resourceUrl.create({
      data: {
        resourceId: imageResource.id,
        speciesId: createdSpecies.id,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(createdSpecies.scientificName.replace(" ", "_"))}`,
      },
    });
  }

  console.log(`Seeded ${mockSpecies.length} species.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
