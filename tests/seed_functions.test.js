import { expect, test, afterAll } from 'vitest'
import { getOrCreateLanguage, readFile, parseCSV, handleAviListRow, getOrCreateImageLicense, handleInatItem } from '../prisma/seed_functions'
import { deleteIfExists } from "../app/common/utils";
import prisma from '../client'

const orderName = 'TEST-Order';
const familyName = 'TEST-Family';
const genusName = 'TEST-Mythicus';
const speciesName = 'TEST-Mythicus phoenicus';
const subspeciesName = 'TEST-Mythicus phoenicus bennu';
const genusName2 = 'TEST-Fantasticus';
const speciesName2 = 'TEST-Fantasticus thorondorus';

const mockInat = `{"${speciesName}":{"inat_id":111,"common_names":{"en":"Common Phoenix","fi":"feeniks"},"image_url":"https://url.com/photos/phnx.jpg","image_attribution":"(c) Kassandra, some rights reserved (CC BY-NC), uploaded by Kassandra","image_license":"cc-by-nc","preferred_common_name":"Common Phoenix","extinct":false},"${subspeciesName}":{"inat_id":112,"common_names":{"en":"Bennu","fi":"Benu-lintu"},"image_url":"https://url.com/photos/bnu.jpg","image_attribution":"(c) Bayek, some rights reserved (CC BY-SA)","image_license":"cc-by-sa","preferred_common_name":"Bennu","extinct":false,"obs_photo":{"url":"https://url.com/photos/bnu-obs.jpg","attribution":"(c) Aya, some rights reserved (CC BY-NC)","license":"cc-by-nc"}},"${speciesName}2":{"inat_id":221,"common_names":{"en":"Great Eagle","fi":"jättiläiskotka"},"image_url":"https://url.com/photos/gree.jpg","image_attribution":"(c) Pippin, all rights reserved","image_license":null,"preferred_common_name":"Thorondor","extinct":true}}`;

afterAll(async () => {
  await deleteIfExists(prisma.language, { code: 'aa-DJ' });
  await deleteIfExists(prisma.species, { scientificName: subspeciesName });
  await deleteIfExists(prisma.species, { scientificName: speciesName });
  await deleteIfExists(prisma.species, { scientificName: speciesName2 });
  await deleteIfExists(prisma.genus, { name: genusName });
  await deleteIfExists(prisma.genus, { name: genusName2 });
  await deleteIfExists(prisma.family, { name: familyName });
  await deleteIfExists(prisma.order, { name: orderName });
});

test.skip('create language Afaraf (DJ)', async () => {
  const lang = await getOrCreateLanguage('aa-DJ');
  expect(lang.code).toBe('aa-DJ');
  expect(lang.name).toBe('Afaraf (DJ)');
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
  const species = await prisma.species.findFirst({ where: { scientificName: speciesName }}) || {};
  const species2 = await prisma.species.findFirst({ where: { scientificName: speciesName2 }}) || {};
  const subspecies = await prisma.species.findFirst({ where: { scientificName: subspeciesName }}) || {};
  const speciesUrls = await prisma.resourceUrl.findMany({
    where: { speciesId: species.id}
  });
  const subspeciesUrls = await prisma.resourceUrl.findMany({
    where: { speciesId: subspecies.id}
  });

  expect(family.orderId).toBe(order.id);
  expect(genus.familyId).toBe(family.id);
  expect(species.genusId).toBe(genus.id);
  expect(species.protonym).toBe('Mythicus phoenicus');
  expect(species.cornellLabCode).toBe('compho1');
  expect(species.avibaseId).toBe('TEST-avibase-1');
  expect(species.IUCN).toBe('LC');
  expect(species.data?.range).toBe('Mediterranean');
  expect(species.data?.type_locality).toBe('Ancient Greece');
  expect(subspecies.cornellLabCode).toBe('compho2');
  expect(subspecies.avibaseId).toBe('TEST-avibase-2');
  expect(subspecies.IUCN).toBe('EX');
  expect(subspecies.parentSpeciesId).toBe(species.id);
  expect(speciesUrls.length).toBe(3);
  expect(subspeciesUrls.length).toBe(1);
  expect(genus2.familyId).toBe(family.id);
  expect(species2.genusId).toBe(genus2.id);
});

test('create image license', async () => {
  const l1 = await getOrCreateImageLicense('cc-by-nc-nd') || {};
  const l2 = await getOrCreateImageLicense('CC BY-SA 4.0') || {};

  console.log('licenses:', l1, l2);
  expect(l1.name).toBe('CC BY-NC-ND');
  expect(l2.url).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
});

test('parse INat data', async () => {
  const inat = JSON.parse(mockInat);

  for (const key in inat) {
    await handleInatItem(key, inat[key]);
  }

  const species = await prisma.species.findFirst({ where: { scientificName: speciesName }, include: { names: true, images: true }}) || {};
  const species2 = await prisma.species.findFirst({ where: { scientificName: speciesName2 }, include: { names: true, images: true }}) || {};
  const subspecies = await prisma.species.findFirst({ where: { scientificName: subspeciesName }, include: { names: true, images: true }}) || {};
  const fi = await prisma.language.findFirst({ where: { code: 'fi' } });
  const en = await prisma.language.findFirst({ where: { code: 'en' } });
  const license = await prisma.imageLicense.findFirst({ where: { name: 'CC BY-NC' } });

  expect(species.images?.length).toBe(1);
  expect(species2.images?.length).toBe(0);
  expect(subspecies.images?.length).toBe(2);

  expect(species.images[0]?.licenseId).toBe(license.id);

  const names = species.names || [];
  const nameFi = names.find((n) => n.languageId === fi.id);
  const nameEn = names.find((n) => n.languageId === en.id);
  expect(names.length).toBe(2);
  expect(nameFi.name).toBe('feeniks');
  expect(nameEn.name).toBe('Common Phoenix');
});