import { readFile as readFileFromDisk } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import locale from 'locale-codes';
import Papa, { ParseResult } from 'papaparse';
import prisma from "../client";
import { IUCNCategory, Language, Resource, Species, Genus, ImageLicense, Image } from "../generated/prisma/client"
import { capitalize, firstOrCreate } from "../app/common/utils";
import Logger from "../app/common/logger";
import { localNames } from "./language_local_names";

type LanguageMap =  {
  [key: string]: Language;
};

type ResourceMap = {
  [key: string]: Resource;
};

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
};

type SpeciesLocality = {
  range?: string;
  type_locality?: string;
  wikipedia_extract?: string;
};

type SpeciesCreate = {
  genus: { connect: { id: number }}
  protonym?: string;
  data?: SpeciesLocality;
  cornellLabCode?: string;
  avibaseId?: string;
  IUCN?: IUCNCategory | null;
  parentSpecies?: { connect: { id: number }}
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rawDataDir = "../birdnet-taxonomy/raw_data/";

/**
 * Reads a UTF-8 file relative to the seed script directory.
 * @param {string} filePath - path to the file relative to the seed script directory
 * @returns {Promise<string | undefined>} file contents, or undefined when reading fails
 */
export const readFile = async (filePath: string): Promise<string | undefined> => {
  const path = resolve(__dirname, filePath);
  Logger.log(`Reading file from path ${path}`);

  try {
    const fileAsStr = readFileFromDisk(path, { encoding: 'utf8' });
    return fileAsStr;
  } catch (e) {
    Logger.error(`Error reading file from path' ${path}:\n`, e);
  }
};

/**
 * Reads and imports taxonomy rows from the configured AviList CSV file.
 * @param {number} from - first row to iterate; 0 to n
 * @param {number} to - last row to iterate; 0 to n
 */
export const readAviList = async (from: number = 0, to?: number) => {
  const listPath = `${rawDataDir}${process.env.AVILIST_FILE_NAME}.csv`;

  try {
    const file = await readFile(listPath);
    if (!file) {
      Logger.error('AviList file returned no content');
      return;
    }

    const results = parseCSV(file) as unknown as ParseResult<ParsedCSVRow>;
    const rows = results?.data || [];
    const rowCount = rows.length;
    const startAt = (from < rowCount) ? from : rowCount - 1;
    const endAt = (to && to > 0 && to < rowCount) ? to : rowCount;

    for (let i = startAt; i < endAt; i++) {
      await handleAviListRow(rows[i]);
    }

  } catch (e: unknown) {
    Logger.error(`Error reading AviList:\n${e}`);
  }
};

let LANGS: string[] | null = null;

/**
 * Reads and imports data from a supported taxonomy JSON file.
 * @param {string} fileName - JSON file name without its extension
 * @param {string[] | null} langs - List of language codes to which common name parsing is limited
 * @param {number} from - first item to iterate; 0 to n
 * @param {number} to - last item to iterate; 0 to n
 */
export const readJsonFile = async (
  fileName: string,
  langs: string[] | null,
  from: number = 0,
  to?: number
) => {
  Logger.log(`Reading JSON file ${fileName}`);
  const filePath = `${rawDataDir}${fileName}.json`;
  LANGS = langs;

  try {
    const file = await readFile(filePath);
    if (!file) {
      Logger.error(`File "${fileName}" returned no content`);
      return;
    }

    const json = await JSON.parse(file);
    const itemCount = Object.keys(json).length;
    const startAt = (from < itemCount) ? from : itemCount - 1;
    const endAt = (to && to > 0 && to < itemCount) ? to : itemCount - 1;

    switch (fileName) {
      case 'wikidata_data':
        Logger.log('Parsing Wikidata data');
        await handleWikidataData(json, startAt, endAt);
        break;
      case 'inat_data':
        Logger.log('Parsing INat data');
        await handleInatData(json, startAt, endAt);
        break;
    }
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      Logger.error(`Invalid JSON in file "${fileName}":\n${e}`);
    } else {
      Logger.error(`Error reading file "${fileName}":\n${e}`);
    }
  } 
};

/**
 * Parses an AviList CSV string.
 * @param {string} fileAsStr - CSV content to parse
 * @returns {Papa.ParseResult<ParsedCSVRow>} parsed CSV data and parsing metadata
 */
export const parseCSV = (fileAsStr: string) => {
  return Papa.parse<ParsedCSVRow>(fileAsStr, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
    complete: (results: ParseResult<ParsedCSVRow>) => {
      Logger.log('CSV file successfully processed');
      if (results.errors.length > 0)
        Logger.error('Errors detected parsing CSV:', results.errors);
    },
    error: (error: Error) => {
      Logger.error('Error parsing CSV row:', error);
    }
  });
};

/**
 * Converts an IUCN or extinction status value to the database enum.
 * @param {string | null} iucnStr - source IUCN category
 * @param {string} extinct - source extinction status
 * @returns {IUCNCategory | null} matching category, or null when none is recognized
 */
const verifyIUCNCategory = (iucnStr: string | null, extinct?: string): IUCNCategory | null => {
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
      Logger.warn(`Unrecognized extinction status "${extinct}" and IUCN category ${iucnStr}`);
      return null;
  }
};

let lastParentSpecies: Species | null = null;

/**
 * Finds the parent species for a subspecies.
 * @param {string} sciName - scientific name of the subspecies
 * @returns {Promise<Species | null>} parent species, or null when it cannot be found
 */
const findParentSpecies = async (sciName: string): Promise<Species | null> => {
  Logger.log(`Finding parent species for ${sciName}`);
  const words = sciName.split(' ');
  if (words.length < 3) return null;

  const parentName = `${words[0]} ${words[1]}`;
  // Logger.log(`Parent species name ${parentName}`);

  const parentSpecies = lastParentSpecies?.scientificName === parentName
    ? lastParentSpecies
    : await prisma.species.findFirst({ where: { scientificName: parentName }}) as Species;

  if (!parentSpecies) Logger.warn(`WARNING: Parent species not found for ${sciName}`);
  else lastParentSpecies = parentSpecies;

  return parentSpecies;
};

/**
 * Creates a species or subspecies and its AviList resource URLs.
 * @param {ParsedCSVRow} row - parsed AviList row
 * @returns {Promise<Species>} created or existing species
 */
const createSpecies = async (row: ParsedCSVRow): Promise<Species> => {
  const sciName = row.Scientific_name;
  Logger.log(`Creating species ${sciName}`);

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
  };

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
};

let lastGenus: Genus | null = null;

/**
 * Creates the taxonomy record represented by an AviList row.
 * @param {ParsedCSVRow} row - parsed AviList row
 * @returns {Promise<unknown | void>} created or existing taxonomy record
 */
export const handleAviListRow = async (row: ParsedCSVRow): Promise<unknown | void> => {
  const sciName = row.Scientific_name;

  switch (row.Taxon_rank) {
    case 'order': {
      Logger.log(`Creating order ${sciName}`);
      return firstOrCreate(prisma.order, { name: sciName });
    }
    case 'family': {
      Logger.log(`Creating family ${sciName}`);
      const o = await prisma.order.findFirst({ where: { name: row.Order }});
      if (!o) throw new Error(`Order not found: ${row.Order}`);

      return firstOrCreate(
        prisma.family,
        { name: sciName },
        { order: { connect: { id: o.id } } }
      );
    }
    case 'genus': {
      Logger.log(`Creating genus ${sciName}`);
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

  Logger.warn(`No action taken for AviList row ${sciName}`);
};

// Wikidata -->

type WikidataItem = {
  ebird_code: string;
  ncbi_id: string;
  avibase_id: string;
  birdlife_id: string;
  gbif_id: string;
  labels?: { [key: string]: string }
  image?: ImageData;
};

type Wikidata = {
  [key: string]: WikidataItem;
};

type WikidataUpdateData = {
  ebirdCode: string;
  ncbiId: number;
  birdlifeId: number;
  gbifId: number
};

/**
 * Processes Wikidata records.
 * @param {Wikidata} wikidata - Wikidata records keyed by species name
 * @param {number} from - first item to iterate; 0 to n
 * @param {number} to - last item to iterate; 0 to n
 */
const handleWikidataData = async (wikidata: Wikidata, from: number, to: number) => {
  const keyList = Object.keys(wikidata);

  for (let i = from; i <= to; i++) {
    const key = keyList[i];
    await handleWikidataItem(key, wikidata[key]);
  }
};

/**
 * Updates a species with Wikidata identifiers, an image, and localized names.
 * @param {string} speciesName - scientific name used to find the species
 * @param {WikidataItem} item - Wikidata record for the species
 */
export const handleWikidataItem = async (speciesName: string, item: WikidataItem) => {
  Logger.log(`Updating species ${speciesName} / Wikidata`);
  const species = await findSpecies(speciesName);

  if (!species) return;

  // Update species data
  const updateData: WikidataUpdateData = {
    ebirdCode: item.ebird_code,
    ncbiId: Number(item.ncbi_id),
    birdlifeId: Number(item.birdlife_id),
    gbifId: Number(item.gbif_id)
  };

  await prisma.species.update({ where: { id: species.id }, data: updateData });

  if (item.image) {
    const img: ImageData = {
      ...item.image,
      attribution: `(c) ${item.image.attribution} (${item.image.license})`
    };
    await createImage(img, species);
  }  

  // Create names
  if (item.labels)
    await createNames(item.labels, species, 'wikidata');
};

// END Wikidata

// INat -->

type ImageData = {
  url: string;
  attribution: string;
  license: string | null;
  license_url?: string;
};

type InatItem = {
  inat_id: number;
  taxon_group: string;
  iconic_taxon_name: string;
  common_names: { [key: string]: string }
  wikipedia_url: string;
  image_url: string;
  image_attribution: string;
  image_license: string | null;
  observations_count: number;
  sound_observations_count: number;
  preferred_common_name: string;
  extinct: boolean
  obs_photo?: ImageData;
  obs_photo_lookup?: {
    status: string;
    checked_at: string;
  };
};

type InatData = {
  [key: string]: InatItem;
};

type InatUpdateData = {
  inatId: number;
  IUCN?: IUCNCategory;
};

/**
 * Iterates through the items in a parsed INat JSON
 * @param {InatData} inatData - 
 * @param {number} from - first item to iterate; 0 to n
 * @param {number} to - last item to iterate; 0 to n
 */
const handleInatData = async (inatData: InatData, from: number, to: number) => {
  const keyList = Object.keys(inatData);

  for (let i = from; i <= to; i++) {
    const key = keyList[i];
    await handleInatItem(key, inatData[key]);
  }
};

/**
 * Updates species data and creates image and name instances for it based on INat data
 * @param {string} speciesName - Scientific name of species
 * @param {InatItem} item - parsed INat data
 */
export const handleInatItem = async (speciesName: string, item: InatItem) => {
  Logger.log(`Updating species ${speciesName} / INat`);
  const species = await findSpecies(speciesName);

  if (!species) return;

  // Update species data
  const updateData: InatUpdateData = { inatId: item.inat_id };
  if (item.extinct && !species.IUCN) {
    updateData.IUCN = IUCNCategory.EX;
  }

  await prisma.species.update({ where: { id: species.id }, data: updateData });

  // Create images
  const images: ImageData[] = [];

  if (item.image_license) {
    images.push({
      url: item.image_url,
      attribution: item.image_attribution,
      license: item.image_license
    });
  }
  if (item.obs_photo?.license) {
    images.push(item.obs_photo);
  }

  for (const img of images) {
    await createImage(img, species);
  }

  // Create names
  await createNames(item.common_names, species, 'inat');
};

// END INat

/**
 * Finds a species by scientific name or protonym, ignoring case.
 * @param {string} speciesName - scientific name or protonym to search for
 * @returns {Promise<Species | null>} matching species, or null when none exists
 */
const findSpecies = async (speciesName: string): Promise<Species | null> => {
  const species = await prisma.species.findFirst({
    where: {
      OR: [
        { scientificName: { equals: speciesName, mode: "insensitive" }},
        { protonym: { equals: speciesName, mode: "insensitive" }}
      ] 
    }
  });

  if (!species) {
    Logger.warn(`No species with the name ${speciesName} found. Skipping.`);
    return null;
  }

  return species;
};

// Correct disparities between language tagging systems
const transformLang = {
  'inat': {
    'nb': 'no',
    'myn': 'yua'
  },
  'wikidata': {
    'sr': 'src',
    'sr-ec': 'src',
    'sr-el': 'sr',
    'crh-latn': 'crh'
  }
};

/**
 * Creates names for a species in various languages
 * @param {{ [key: string]: string }} names - hash with language codes as keys and species names as values
 * @param {Species} species
 * @param {string} source - identifier for  source of data
 */
export const createNames = async (names: { [key: string]: string }, species: Species, source: string) => {
  const transformSet = transformLang[source as keyof typeof transformLang] || {};

  for (const key in names) {
    let code = key.replace('_', '-').toLowerCase();
    code = transformSet[key as keyof typeof transformSet] || key;
    if (LANGS && !LANGS.includes(code)) continue;

    const lang = await getOrCreateLanguage(code);
    if (!lang) continue;

    const whereProps = {
      speciesId: species.id,
      languageId: lang.id
    };

    await firstOrCreate(
      prisma.speciesName,
      whereProps,
      { name: names[key] }
    );
  }
};

/**
 * Creates a new Image instance
 * @param {ImageData} imageData - hash detailing the url, attribution, and license of an image
 * @param {Species} species
 * @returns {Promise<Image | null>}
 */
const createImage = async (imageData: ImageData, species: Species): Promise<Image | null> => {
  if (!imageData.license) {
    Logger.warn('Cannot create due to missing license:', imageData.url);
    return null;
  }

  const license = await getOrCreateImageLicense(imageData.license);

  if (!license) {
    Logger.error('Failure to get license for image:', imageData.url);
    return null;
  }

  const whereData = {
    url: imageData.url,
    speciesId: species.id,
    licenseId: license.id
  };
  const createData = {
    attribution: imageData.attribution
  };

  return await firstOrCreate(
    prisma.image,
    whereData,
    createData
  ) as Image;
};

const imageLicenses: ImageLicense[] = [];

/**
 * Determines standardized name for license
 * @param {string} baseName - license identifier from INat or Wikidata
 * @returns {string | null} - standardized license name or null if unidentified license type
 */
const determineLicenseName = (baseName: string): string | null => {
  const name = baseName.trim().toUpperCase();

  // Name formats: "cc-by-nc-nd" (INat), "CC BY-SA 4.0" (Wikidata)
  if (name.startsWith('CC')) return name.replace('CC-', 'CC ');

  if (name.startsWith('PD') || name === 'PUBLIC DOMAIN') return 'PD';

  if (name.startsWith('GFDL')) return name;

  return null;
}

/**
 * Creates a new ImageLicense instance or returns an existing one
 * @param {string} baseName - license identifier from INat or Wikidata
 * @returns {Promise<ImageLicense | null>}
 */
export const getOrCreateImageLicense = async (baseName: string): Promise<ImageLicense | null> => {
  const name = determineLicenseName(baseName);

  if (!name) {
    Logger.error(`Invalid image license name "${baseName}". Cannot create license.`);
    return null;
  }

  const license = imageLicenses.find((l) => l.name === name);
  if (license) return license;

  const nameSplit = name.split(' ');

  let url: string | null = null;
  
  switch (nameSplit[0]) {
    case 'CC0':
      url = 'https://creativecommons.org/publicdomain/zero/1.0/';
      break;
    case 'PD':
      url = 'https://creativecommons.org/publicdomain/mark/1.0/';
      break;
    case 'GFDL': {
      if (nameSplit.length > 1) {
        url = `https://www.gnu.org/licenses/fdl-${nameSplit[1]}.html`;
      }
      break;
    }
    default: {
      if (nameSplit.length > 1) {
        url = `https://creativecommons.org/licenses/${nameSplit[1].toLowerCase()}/`;
      }
    }
  }

  if (!url) {
    Logger.error(`Couldn't create a URL for license "${baseName}"`);
    return null;
  }

  if (nameSplit.length === 3) url = `${url}${nameSplit[2]}/`;

  Logger.log(`Creating image license "${name}" with url: ${url}`);
  const newLicense = await firstOrCreate(
    prisma.imageLicense,
    { name },
    { url }
  ) as ImageLicense;

  if (newLicense) imageLicenses.push(newLicense);
  else {
    Logger.error(`Failed to create image license "${name}"`);
    return null;
  }

  return newLicense;
};

// RESOURCES -->

const aviListResourceNameMap = {
  BirdLife_DataZone_URL: 'BirdLife DataZone',
  Birds_of_the_World_URL: 'Birds of the World',
  Original_description_URL: 'Biodiversity Heritage Library',
};

const resourceNameMap = {
  ...aviListResourceNameMap,
  wikipedia: 'Wikipedia'
};

const resources: ResourceMap = {};

/**
 * Creates a resource or returns the cached resource for a known resource key.
 * @param {keyof typeof resourceNameMap} key - resource identifier
 * @returns {Promise<Resource>} created or existing resource
 */
export const getOrCreateResource = async (key: keyof typeof resourceNameMap) => {
  if (resources[key]) return resources[key];

  const name = resourceNameMap[key];

  Logger.log(`Creating resource: ${name}`);
  const resource = await firstOrCreate(
    prisma.resource,
    { name }
  );

  if (resource) resources[key] = resource as Resource;
  else Logger.warn(`Failed to create resource ${name}`);
  
  return resource;
};

/**
 * Creates a URL resource association for a species when the source row contains a URL.
 * @param {ParsedCSVRow} row - parsed AviList row
 * @param {Species} species - species associated with the URL
 * @param {keyof typeof resourceNameMap} key - resource identifier and row field
 * @returns {Promise<ResourceUrl | undefined>} created association, or undefined without a URL
 */
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
};

// END RESOURCES

// LANGUAGES -->

const languageIds: LanguageMap = {};

// Get language id based on code
/**
 * Creates a new Language instance or returns an existing one
 * @param {string} code - language identifier
 * @returns {Promise<Language | null>}
 */
export const getOrCreateLanguage = async (code: string): Promise<Language | null> => {
  const lang = languageIds[code];
  if (lang) return lang;
  
  let name =
    locale.getByTag(code)?.local ||
    localNames[code as keyof typeof localNames];
  
  const split = code.split('-');
  if (!name) {
    name =
      locale.getByTag(split[0])?.local ||
      localNames[split[0] as keyof typeof localNames] ||
      `MISSING_LOCAL-${code}`;
  }

  if (split.length == 2 && !['arab', 'cyrl', 'latn', 'hant', 'hani'].includes(split[1])) {
    name = `${name} (${capitalize(split[1])})`;
  }

  Logger.log(`Creating language ${code}: ${name}`);
  const newLang = await firstOrCreate(
    prisma.language,
    { code },
    { name }
  ) as Language;

  if (newLang) languageIds[code] = newLang;
  else {
    Logger.error(`Failed to create language ${code}`);
    return null;
  }

  return newLang;
};

// END LANGUAGES
