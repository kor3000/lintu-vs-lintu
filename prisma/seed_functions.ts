import { readFile as readFileFromDisk } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import locale from 'locale-codes';
import Papa, { ParseResult } from 'papaparse';

import prisma from "../client";
import { IUCNCategory, Language, Resource, Species, Genus } from "@prisma/client"
import { capitalize, firstOrCreate } from "../app/common/utils";

type LanguageMap =  {
  [key: string]: Language;
}

type ResourceMap = {
  [key: string]: Resource;
}

type ParsedCSVRow = {
  Taxon_rank: string;
  Scientific_name: string;
  Protonym: string;
  Order: string;
  Family: string;
  Range: string;
  Type_locality: string;
  Extinct_or_possibly_extinct: string;
  IUCN_Red_List_Category: string;
  Species_code_Cornell_Lab: string;
  AvibaseID: string;
  BirdLife_DataZone_URL: string;
  Birds_of_the_World_URL: string;
  Original_description_URL: string;
  [key: string]: string;
}

type SpeciesLocality = {
  range?: string;
  type_locality?: string;
  wikipedia_extract?: string;
}

type SpeciesCreate = {
  genus: { connect: { id: number }}
  protonym?: string;
  data?: SpeciesLocality;
  cornellLabCode?: string;
  avibaseId?: string;
  IUCN?: IUCNCategory | null;
  parentSpecies?: { connect: { id: number }}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rawDataDir = "../birdnet-taxonomy/raw_data/";

export const readFile2 = async (filePath: string): Promise<File> => {
  const path = resolve(__dirname, filePath);
  console.log(`Reading file from path ${path}`);
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

      console.log('RESULT:', reader.result);
      resolve(new File([reader.result], fileName));
    };
    reader.onerror = () => reject(reader.error ?? new Error(`Unable to read file: ${path}`));
    reader.readAsArrayBuffer(new Blob([new Uint8Array(contents)]));
  });
};

export const readFile = async (filePath: string) => {
  const path = resolve(__dirname, filePath);
  console.log(`Reading file from path ${path}`);

  try {
    const fileAsStr = readFileFromDisk(path, { encoding: 'utf8' });
    return fileAsStr;
  } catch (e) {
    console.error(`Error reading file from path' ${path}:\n`, e);
  }
};

export const readAviList = async (cap = 0) => {
  const listPath = `${rawDataDir}${process.env.AVILIST_FILE_NAME}.csv`;

  try {
    const file = await readFile(listPath);
    if (!file) {
      console.error('AviList file returned no content');
      return;
    }

    const results = parseCSV(file) as unknown as ParseResult<ParsedCSVRow>;
    const rows = results?.data || [];
    const limit = (cap > 0) ? cap : rows.length;
    for (let i = 0; i < limit; i++) {
      await handleAviListRow(rows[i]);
    }

  } catch (e: unknown) {
    console.error(`Error reading AviList:\n${e}`);
  }
};

export const parseCSV = (fileAsStr: string) => {
  return Papa.parse<ParsedCSVRow>(fileAsStr, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
    complete: (results: ParseResult<ParsedCSVRow>) => {
      console.log('CSV file successfully processed');
      console.log('Errors detected parsing CSV:', results.errors);
    },
    error: (error: Error) => {
      console.error('Error parsing CSV row:', error);
    }
  });
};

const verifyIUCNCategory = (iucnStr: string | null, extinct?: string) => {
  const iucn = iucnStr?.trim().toUpperCase().split(' ')[0];
  if (iucn && Object.hasOwn(IUCNCategory, iucn)) {
    return IUCNCategory[iucn as keyof typeof IUCNCategory];
  }
  if (!extinct) return null;

  switch (extinct?.trim().toLowerCase()) {
    case 'extinct':
    case '(extinct)':
      return IUCNCategory.EX;
    case 'possibly extinct':
    case '(possibly extinct)':
      return IUCNCategory.CR;
    case 'extinct in the wild':
      return IUCNCategory.EW;
    default:
      console.warn(`Unrecognized extinction status: ${iucn}`);
      return null;
  }
}

let lastParentSpecies: Species | null = null;

const findParentSpecies = async (sciName: string) => {
  console.log(`Finding parent species for ${sciName}`);
  const words = sciName.split(' ');
  if (words.length < 3) return null;

  const parentName = `${words[0]} ${words[1]}`;
  // console.log(`Parent species name ${parentName}`);

  const parentSpecies = lastParentSpecies?.scientificName === parentName
    ? lastParentSpecies
    : await prisma.species.findFirst({ where: { scientificName: parentName }}) as Species;

  if (!parentSpecies) console.warn(`WARNING: Parent species not found for ${sciName}`);
  else lastParentSpecies = parentSpecies;

  return parentSpecies;
}

const createSpecies = async (row: ParsedCSVRow) => {
  const sciName = row.Scientific_name;
  console.log(`Creating species ${sciName}`);

  const genusName = sciName.split(' ')[0];
  const g = lastGenus && lastGenus.name === genusName
    ? lastGenus
    : await prisma.genus.findFirst({ where: { name: genusName }});

  if (!g) throw new Error(`Genus not found: ${genusName}`);

  const createProps: SpeciesCreate = {
    genus: { connect: { id: g.id }},
    protonym: row.Protonym,
    cornellLabCode: row.Species_code_Cornell_Lab,
    avibaseId: row.AvibaseID,
    IUCN: verifyIUCNCategory(row.IUCN_Red_List_Category, row.Extinct_or_possibly_extinct)
  };

  if (row.Range || row.Type_locality) {
    const locality: SpeciesLocality = {};
    if (row.Range) locality.range = row.Range;;
    if (row.Type_locality) locality.type_locality = row.Type_locality;
    createProps.data = locality;
  }

  const parentSpecies = row.Taxon_rank === 'subspecies'
    ? await findParentSpecies(sciName)
    : null;
  if (parentSpecies) createProps.parentSpecies = { connect: { id: parentSpecies.id }};

  const data = { scientificName: sciName };
  const species = await firstOrCreate(prisma.species, data, createProps) as Species;

  // Create resources
  for (const k of Object.keys(aviListResourceNameMap)) {
    await createResourceUrl(row, species, k as keyof typeof resourceNameMap);
  }

  return species
}

let lastGenus: Genus | null = null;

// Extract species and taxon data from parsed AviList rows
export const handleAviListRow = async (row: ParsedCSVRow) => {
  const sciName = row.Scientific_name;

  switch (row.Taxon_rank) {
    case 'order': {
      console.log(`Creating order ${sciName}`);
      return firstOrCreate(prisma.order, { name: sciName });
    }
    case 'family': {
      console.log(`Creating family ${sciName}`);
      const o = await prisma.order.findFirst({ where: { name: row.Order }});
      if (!o) throw new Error(`Order not found: ${row.Order}`);

      return firstOrCreate(
        prisma.family,
        { name: sciName },
        { order: { connect: { id: o.id } } }
      );
    }
    case 'genus': {
      console.log(`Creating genus ${sciName}`);
      const f = await prisma.family.findFirst({ where: { name: row.Family }});
      if (!f) throw new Error(`Family not found: ${row.Family}`);

      const genus = await firstOrCreate(
        prisma.genus,
        { name: sciName },
        { family: { connect: { id: f.id } }
      }) as Genus;

      lastGenus = genus;
      return genus;
    }
    case 'species':
    case 'subspecies':
    {
      return await createSpecies(row);
    }
  }

  console.warn(`No action taken for AviList row ${sciName}`);
};

// RESOURCES -->

const aviListResourceNameMap = {
  BirdLife_DataZone_URL: 'BirdLife DataZone',
  Birds_of_the_World_URL: 'Birds of the World',
  Original_description_URL: 'Biodiversity Heritage Library',
};

const resourceNameMap = {
  ...aviListResourceNameMap,
  wikipedia: "Wikipedia"
};

const resources: ResourceMap = {};

export const getOrCreateResource = async (key: keyof typeof resourceNameMap) => {
  if (resources[key]) return resources[key];

  const name = resourceNameMap[key];

  console.log(`Creating resource: ${name}`);
  const resource = await firstOrCreate(
    prisma.resource,
    { name }
  );

  if (resource) resources[key] = resource as Resource;
  else console.warn(`Failed to create resource ${name}`);
  
  return resource;
};

const createResourceUrl = async (
  row: ParsedCSVRow,
  species: Species,
  key: keyof typeof resourceNameMap
) => {
  const url = row[key];
  if (!url || url.length === 0) return;

  const resource = await getOrCreateResource(key);

  const rUrl = await prisma.resourceUrl.create({
    data: {
      url,
      speciesId: species.id,
      resourceId: resource.id
    }
  });
 
  return rUrl;
}

// END RESOURCES

const languageIds: LanguageMap = {};

// Get language id based on code
export const getOrCreateLanguage = async (code: string) => {
  const lang = languageIds[code];
  if (lang) return lang;

  let name = locale.getByTag(code).local;
  const split = code.split('-');

  if (split.length == 2) {
    name = `${name} (${capitalize(split[1])})`;
  }

  console.log(`Creating language ${code}: ${name}`);
  const newLang = await firstOrCreate(
    prisma.language,
    { code },
    { name }
  ) as Language;

  if (newLang) languageIds[code] = newLang;
  else console.warn(`Failed to create language ${code}`);

  return newLang;
};

