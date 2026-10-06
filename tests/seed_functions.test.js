import { expect, test, afterAll } from 'vitest'
import {
  getOrCreateLanguage,
  readFile,
  parseCSV,
  handleAviListRow,
  getOrCreateImageLicense,
  handleInatItem,
  handleWikidataItem,
  handleWikipediaItem,
  handleMacauleyItem
} from '../prisma/seed_functions'
import { deleteIfExists } from "../app/common/utils";
import prisma from '../client'

const orderName = 'TEST-Order';
const familyName = 'TEST-Family';
const genusName = 'TEST-Mythicus';
const speciesName = 'TEST-Mythicus phoenicus';
const subspeciesName = 'TEST-Mythicus phoenicus bennu';
const genusName2 = 'TEST-Fantasticus';
const speciesName2 = 'TEST-Fantasticus thorondorus';
const langCode = 'zzzz-xy';

const mockWikidata = `{"${speciesName}":{"ebird_code":"fnx123","gbif_id":"123","ncbi_id":"456","birdlife_id":"789","labels":{"et":"Fööniks","cy":"Ffenics"},"image":{"url":"https://upload.wiki.org/d/phnx.jpg","attribution":"FooBar","license":"CC BY-SA 2.0","license_url":"https://"}}}`;
const mockInat = `{"${speciesName}":{"inat_id":111,"common_names":{"en":"Common Phoenix","fi":"feeniks"},"image_url":"https://url.com/photos/phnx.jpg","image_attribution":"(c) Kassandra, some rights reserved (CC BY-NC), uploaded by Kassandra","image_license":"cc-by-nc","preferred_common_name":"Common Phoenix","extinct":false},"${subspeciesName}":{"inat_id":112,"common_names":{"en":"Bennu","fi":"Benu-lintu"},"image_url":"https://url.com/photos/bnu.jpg","image_attribution":"(c) Bayek, some rights reserved (CC BY-SA)","image_license":"cc-by-sa","preferred_common_name":"Bennu","extinct":false,"obs_photo":{"url":"https://url.com/photos/bnu-obs.jpg","attribution":"(c) Aya, some rights reserved (CC BY-NC)","license":"cc-by-nc"}},"${speciesName2}":{"inat_id":221,"common_names":{"en":"Great Eagle","fi":"jättiläiskotka"},"image_url":"https://url.com/photos/gree.jpg","image_attribution":"(c) Pippin, all rights reserved","image_license":null,"preferred_common_name":"Thorondor","extinct":true}}`;
const mockWikipedia = `{"${speciesName}":{"title":"","extract":"","description":"","wikipedia_urls":{"en":"https://en.wiki.org/wiki/Phoenix","fi":"https://fi.wiki.org/wiki/Feeniks"},"extracts":{},"image_url":"https://up.wiki.org/i/feeniks.jpg?utm_campaign=api"}}`;

afterAll(async () => {
  await deleteIfExists(prisma.language, { code: langCode });
  await deleteIfExists(prisma.species, { scientificName: subspeciesName });
  await deleteIfExists(prisma.species, { scientificName: speciesName });
  await deleteIfExists(prisma.species, { scientificName: speciesName2 });
  await deleteIfExists(prisma.genus, { name: genusName });
  await deleteIfExists(prisma.genus, { name: genusName2 });
  await deleteIfExists(prisma.family, { name: familyName });
  await deleteIfExists(prisma.order, { name: orderName });
  await prisma.$disconnect();
});

test('create language', async () => {
  const lang = await getOrCreateLanguage(langCode);
  expect(lang.code).toBe(langCode);
  expect(lang.name).toBe('TEST-LANG (Xy)');
});

test('extract species data from AviList CSV', async () => {
  const file = await readFile('../tests/TestCSV.csv');

  const results = parseCSV(file);
  // console.log('rows received:', results);
  const rows = results?.data || [];
  expect(rows.length).toBe(7);

  for (const row of rows) {
    await handleAviListRow(row);
  }

  const order = await prisma.order.findFirst({ where: { name: orderName }}) || {};
  const family = await prisma.family.findFirst({ where: { name: familyName }}) || {};
  const genus = await prisma.genus.findFirst({ where: { name: genusName }}) || {};
  const genus2 = await prisma.genus.findFirst({ where: { name: genusName2 }}) || {};
  const species = await prisma.species.findFirst({ where: { scientificName: speciesName }, include: { resourceUrls: true }}) || {};
  const species2 = await prisma.species.findFirst({ where: { scientificName: speciesName2 }}) || {};
  const subspecies = await prisma.species.findFirst({ where: { scientificName: subspeciesName }, include: { resourceUrls: true }}) || {};

  expect(family.orderId).toBe(order.id);
  expect(genus.familyId).toBe(family.id);
  expect(genus2.familyId).toBe(family.id);
  expect(species2.genusId).toBe(genus2.id);

  const resourceUrlBase = {
    id: expect.any(Number),
    languageId: null,
    resourceId: expect.any(Number),
    speciesId: expect.any(Number)
  };

  expect(species).toEqual(
    expect.objectContaining({
      id: expect.any(Number),
      scientificName: speciesName,
      genusId: genus.id,
      protonym: 'Mythicus phoenicus',
      cornellLabCode: 'compho1',
      avibaseId: 'TEST-1',
      IUCN: 'LC',
      data: expect.objectContaining({
        range: 'Mediterranean',
        type_locality: 'Ancient Greece'
      }),
      resourceUrls: expect.objectContaining([
        { ...resourceUrlBase, url: 'https://datazone.testlife.org/species/factsheet/1'},
        { ...resourceUrlBase, url: 'https://testsoftheworld.org/bow/species/compho1/' },
        { ...resourceUrlBase, url: 'https://www.test.org/item/phoenix' }
      ])
    }),
  );
  expect(subspecies).toEqual(
    expect.objectContaining({
      id: expect.any(Number),
      scientificName: subspeciesName,
      genusId: genus.id,
      parentSpeciesId: species.id,
      protonym: expect.any(String),
      cornellLabCode: 'compho2',
      avibaseId: 'TEST-2',
      IUCN: 'EX',
      resourceUrls: expect.objectContaining([
        { ...resourceUrlBase, url: 'https://www.test.org/item/bennu'}
      ])
    }),
  );
});

test('create image license', async () => {
  const l1 = await getOrCreateImageLicense('cc-by-nc-nd') || {};
  const l2 = await getOrCreateImageLicense('CC BY-SA 4.0') || {};

  expect(l1.name).toBe('CC BY-NC-ND');
  expect(l2.url).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
});

const nameBase = {
  id: expect.any(Number),
  languageId: expect.any(Number),
  speciesId: expect.any(Number)
};

const imageBase = {
  id: expect.any(Number),
  speciesId: expect.any(Number),
  licenseId: expect.any(Number),
  attribution: expect.any(String)
};

test('parse INat data', async () => {
  const inat = JSON.parse(mockInat);

  for (const key in inat) {
    await handleInatItem(key, inat[key]);
  }

  const species = await prisma.species.findFirst({ where: { scientificName: speciesName }, include: { names: true, images: true }}) || {};
  const species2 = await prisma.species.findFirst({ where: { scientificName: speciesName2 }, include: { names: true, images: true }}) || {};
  const subspecies = await prisma.species.findFirst({ where: { scientificName: subspeciesName }, include: { names: true, images: true }}) || {};
  const license = await prisma.imageLicense.findFirst({ where: { name: 'CC BY-NC' } });

  expect(species2.images?.length).toBe(0);

  const names = species.names || [];
  expect(names).toContainEqual({ ...nameBase, name: 'feeniks' });
  expect(names).toContainEqual({ ...nameBase, name: 'Common Phoenix' });

  const imgs = subspecies.images || [];
  expect(imgs).toContainEqual({ ...imageBase, url: 'https://url.com/photos/bnu.jpg' });
  expect(imgs).toContainEqual({ ...imageBase, licenseId: license?.id, url: 'https://url.com/photos/bnu-obs.jpg' });
});

test('parse Wikidata data', async () => {
  const wikid = JSON.parse(mockWikidata);

  for (const key in wikid) {
    await handleWikidataItem(key, wikid[key]);
  }

  const species = await prisma.species.findFirst({ where: { scientificName: speciesName }, include: { names: true, images: true }}) || {};
  const names = species.names || [];

  expect(names).toContainEqual({ ...nameBase, name: 'Fööniks' });
  expect(names).toContainEqual({ ...nameBase, name: 'Ffenics' });
  expect(species.images).toContainEqual({
    ...imageBase,
    attribution: '(c) FooBar (CC BY-SA 2.0)',
    url: 'https://upload.wiki.org/d/phnx.jpg'
  });

  expect(species.ebirdCode).toBe('fnx123');
  expect(species.gbifId).toBe(123);
  expect(species.ncbiId).toBe(456);
  expect(species.birdlifeId).toBe(789);
});

test('parse Wikipedia data', async () => {
  const wikip = JSON.parse(mockWikipedia);

  for (const key in wikip) {
    await handleWikipediaItem(key, wikip[key]);
  }

  const species = await prisma.species.findFirst({ where: { scientificName: speciesName }, include: { images: true, resourceUrls: true }}) || {};

  expect(species.images).toContainEqual({
    ...imageBase,
    attribution: 'CC upload to Wikimedia.',
    url: 'https://up.wiki.org/i/feeniks.jpg'
  });

  const resourceBase = {
    id: expect.any(Number),
    languageId: expect.any(Number),
    resourceId: expect.any(Number),
    speciesId: expect.any(Number),
  };
  expect(species.resourceUrls).toContainEqual({ ...resourceBase, url: 'https://en.wiki.org/wiki/Phoenix' });
  expect(species.resourceUrls).toContainEqual({ ...resourceBase, url: 'https://fi.wiki.org/wiki/Feeniks' });
});

test('parse Macaulay data', async () => {
  await handleMacauleyItem(speciesName, {"ml_taxon_code": "fnx-mac"});

  const species = await prisma.species.findFirst({ where: { scientificName: speciesName }}) || {};
  expect(species.macaulayCode).toBe('fnx-mac');
})
