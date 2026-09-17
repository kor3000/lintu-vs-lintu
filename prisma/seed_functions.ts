import { readFile as readFileFromDisk } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import locale from 'locale-codes';
import Papa, { ParseResult } from 'papaparse';
import prisma from "../client";
import { IUCNCategory, Language, Resource, Species, Genus, ImageLicense, Image } from "../generated/prisma/client"
import { capitalize, firstOrCreate } from "../app/common/utils";

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

export const readJsonFile = async (fileName: string, cap = 0) => {
  console.log(`Reading JSON file ${fileName}`);
  const filePath = `${rawDataDir}${fileName}.json`;

  try {
    const file = await readFile(filePath);
    if (!file) {
      console.error(`File "${fileName}" returned no content`);
      return;
    }

    const json = await JSON.parse(file);
    const limit = (cap > 0) ? cap : Object.keys(json).length;

    switch (fileName) {
      case 'inat_data': {
        console.log('Parsint INat data');
        await handleInatData(json, limit);
        break;
      }
    }
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      console.error(`Invalid JSON in file "${fileName}":\n${e}`);
    } else {
      console.error(`Error reading file "${fileName}":\n${e}`);
    }
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
      console.warn(`Unrecognized extinction status "${extinct}" and IUCN category ${iucnStr}`);
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

type ImageData = {
  url: string;
  attribution: string;
  license: string | null;
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
}

type InatData = {
  [key: string]: InatItem;
};

type InatUpdateData = {
  inatId: number;
  IUCN?: IUCNCategory;
};

/**
 * Iterates through the items in a parsed INat JSON
 * @param {InatData} inatData - Scientific name of species
 * @param {number} cap - limit for number of iterations
 */
const handleInatData = async (inatData: InatData, limit: number) => {
  let i = 0;
  for (const key in inatData) {
    if (i > limit) break;

    await handleInatItem(key, inatData[key]);
    i += 1;
  }
};

/**
 * Updates species data and creates image and name instances for it based on INat data
 * @param {string} speciesName - Scientific name of species
 * @param {InatItem} item - parsed INat data
 */
export const handleInatItem = async (speciesName: string, item: InatItem) => {
  console.log(`Updating species ${speciesName}`);
  const species = await prisma.species.findFirst({
    where: {
      OR: [
        { scientificName: { equals: speciesName, mode: "insensitive" }},
        { protonym: { equals: speciesName, mode: "insensitive" }}
      ] 
    }
  });

  if (!species) {
    console.warn(`No species with the name ${speciesName} found. Skipping.`);
    return;
  }

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
  await createNames(item.common_names, species, true);
};

/**
 * Creates names for a species in various languages
 * @param {{ [key: string]: string }} names - hash with language codes as keys and species names as values
 * @param {Species} species
 * @param {boolean} doTransform - whether to transform certain language code tags
 */
export const createNames = async (names: { [key: string]: string }, species: Species, doTransform: boolean = false) => {
  for (const key in names) {
    const lang = await getOrCreateLanguage(key, doTransform);
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
}

/**
 * Creates a new Image instance
 * @param {ImageData} imageData - hash detailing the url, attribution, and license of an image
 * @param {Species} species
 * @returns {Promise<Image | null>}
 */
const createImage = async (imageData: ImageData, species: Species): Promise<Image | null> => {
  if (!imageData.license) {
    console.warn('Cannot create due to missing license:', imageData.url);
    return null;
  }

  const license = await getOrCreateImageLicense(imageData.license);

  if (!license) {
    console.error('Failure to get license for image:', imageData.url);
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
 * Creates a new ImageLicense instance or returns an existing one
 * @param {string} baseName - license identifier from INat or Wikidata
 * @returns {Promise<ImageLicense | null>}
 */
export const getOrCreateImageLicense = async (baseName: string): Promise<ImageLicense | null> => {
  // Name formats: "cc-by-nc-nd" (INat), "CC BY-SA 4.0" (Wikidata)
  const name = baseName.trim().toUpperCase().replace('CC-', 'CC ');
  const license = imageLicenses.find((l) => l.name === name);
  if (license) return license;

  const nameSplit = name.split(' ');
  const firstVal = nameSplit[0];

  if (!firstVal.startsWith('CC') && firstVal !== 'PD') {
    console.error(`Invalid image license name "${name}". Cannot create license.`);
    return null;
  }

  let url: string | null = null;
  
  switch (nameSplit[0]) {
    case 'CC0':
      url = 'https://creativecommons.org/publicdomain/zero/1.0/';
      break;
    case 'PD':
      url = 'https://creativecommons.org/publicdomain/mark/1.0/';
      break;
    default: {
      if (nameSplit.length > 1) {
        url = `https://creativecommons.org/licenses/${nameSplit[1].toLowerCase()}/`;
      }
    }
  }

  if (!url) {
    console.error(`Couldn't create a URL for license "${baseName}"`);
    return null;
  }

  if (nameSplit.length === 3) url = `${url}${nameSplit[2]}/`;

  console.log(`Creating image license "${name}" with url: ${url}`);
  const newLicense = await firstOrCreate(
    prisma.imageLicense,
    { name },
    { url }
  ) as ImageLicense;

  if (newLicense) imageLicenses.push(newLicense);
  else {
    console.error(`Failed to create image license "${name}"`);
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

// LANGUAGES -->

// Correct disparities between language tagging systems
// wikidata needs sr --> src
const langCodeTransformations = {
  'sr': 'src',
  'nb': 'no',
  'myn': 'yua'
}

// Local names missing from the locale-codes library
const localNames = {
  'an': 'aragonés',
  'ang': 'Ænglisc sprǣc',
  'arz': 'للغه المصريه الحديثه',
  'ast': 'asturianu',
  'atj': 'Atikamekw Nehiromowin',
  'avk': 'Kotava',
  'bn': 'বাংলা',
  'ceb': 'Sinugboanon',
  'chr': 'ᏣᎳᎩ ᎧᏬᏂᎯᏍᏗ',
  'chy': 'Tsêhesenêstsestôtse',
  'ckb': 'کوردیی ناوەندی',
  'cs': 'čeština',
  'cy': 'Cymraeg',
  'de': 'Deutsch',
  'dsb': 'dolnoserbšćina',
  'el': 'ελληνικά',
  'eu': 'Euskara',
  'ext': 'Lengua estremeña',
  'fa': 'فارسی',
  'fil': 'Wikang Filipino',
  'fr': 'français',
  'frr': 'Nuurdfresk',
  'fy': 'Frysk',
  'haw': 'ʻōlelo Hawaiʻi',
  'hsb': 'Hornjoserbšćina',
  'hy': 'հայերեն',
  'ie': 'Interlingue',
  'inh': 'гӏалгӏай',
  'io': 'Ido',
  'is': 'íslenska',
  'ka': 'ქართული ენა',
  'kbd': 'Къэбэрдей',
  'kk-arab': 'قازاق ٴتىلى',
  'kk-cyrl': 'қазақ тілі',
  'kk-latn': 'Qazaq tılı',
  'ku-arab': 'کوردی',
  'ku-latn': 'Kurdî',
  'mg': 'Fiteny malagasy',
  'mi': 'Māori',
  'mk': 'македонски',
  'mnc': 'ᠮᠠᠨᠵᡠ ᡤᡳᠰᡠᠨ',
  'mni': 'ꯃꯤꯇꯩ ꯂꯣꯟ',
  'mrj': 'Мары йӹлмӹ',
  'my': 'မြန်မာဘာသာစကား',
  'ms': 'Bahasa Melayu',
  'nl': 'Nederlands',
  'nn': 'nynorsk',
  'no': 'norsk (bokmål)',
  'nv': 'Diné bizaad',
  'oc': 'lenga d\'òc',
  'oj': 'Anishinaabemowin',
  'olo': 'Livvinkarjala',
  'pam': 'Kapampángan',
  'pap': 'Papiamentu',
  'pap-aw': 'Papiamento',
  'pdc': 'Pennsylvanisch Deitsch',
  'pms': 'Piemontèis',
  'ro': 'limba română',
  'sah': 'Саха тыла',
  'sat': 'ᱥᱟᱱᱛᱟᱲᱤ',
  'sco': 'Scots',
  'se': 'davvisámegiella',
  'sh': 'srpskohrvatski jezik',
  'sk': 'slovenčina',
  'sma': 'åarjelsaemiengïele',
  'smn': 'anarâškielâ',
  'sms': 'nuõʹrttsääʹmǩiõll',
  'sw': 'Kiswahili',
  'sq': 'shqip',
  'sr': 'srpski',
  'src': 'српски',
  'udm': 'Удмурт кыл',
  'war': 'Waray',
  'wuu': '吴语',
  'yua': 'mayaʼ tʼaan',
  'yue': '粵語',
  'zh': '中文',
  'zh-cn': '汉语',
  'zh-hans': '汉语',
  'zh-hant': '漢語',
  'zh-tw': '漢語',
};

const languageIds: LanguageMap = {};

// Get language id based on code
/**
 * Creates a new Language instance or returns an existing one
 * @param {string} codeStr - language identifier from INat, eBird names, or Wikidata
 * @param {boolean} doTransform - whether to transform certain language code tags
 * @returns {Promise<Language | null>}
 */
export const getOrCreateLanguage = async (codeStr: string, doTransform: boolean = false): Promise<Language | null> => {
  let code = codeStr.replace('_', '-');

  if (doTransform && code in langCodeTransformations) {
    code = langCodeTransformations[code as keyof typeof langCodeTransformations];
  }

  const lang = languageIds[code];
  if (lang) return lang;

  const split = code.split('-');
  let name =
    locale.getByTag(code)?.local ||
    localNames[code as keyof typeof localNames];
  
  if (!name) {
    name =
      locale.getByTag(split[0])?.local ||
      localNames[split[0] as keyof typeof localNames] ||
      `MISSING_LOCAL-${code}`;
  }

  if (split.length == 2 && !['arab', 'cyrl', 'latn'].includes(split[1])) {
    name = `${name} (${capitalize(split[1])})`;
  }

  console.log(`Creating language ${code}: ${name}`);
  const newLang = await firstOrCreate(
    prisma.language,
    { code },
    { name }
  ) as Language;

  if (newLang) languageIds[code] = newLang;
  else {
    console.error(`Failed to create language ${code}`);
    return null;
  }

  return newLang;
};

// END LANGUAGES
