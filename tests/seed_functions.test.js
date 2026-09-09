import { expect, test, afterAll } from 'vitest'
import { getOrCreateLanguage, readFile, parseCSV, handleAviListRow } from '../prisma/seed_functions'
import { deleteIfExists } from "../app/common/utils";
import prisma from '../client'

const orderName = 'TEST-Order';
const familyName = 'TEST-Family';
const genusName = 'TEST-Mythicus';
const speciesName = 'TEST-Mythicus phoenicus';
const subspeciesName = 'TEST-Mythicus phoenicus bennu';
const genusName2 = 'TEST-Fantasticus';
const speciesName2 = 'TEST-Fantasticus thorondorus';

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

test('extract species data from CSV', async () => {
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

