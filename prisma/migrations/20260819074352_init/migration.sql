-- CreateEnum
CREATE TYPE "IUCNCategory" AS ENUM ('EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC');

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "familyId" INTEGER NOT NULL,

    CONSTRAINT "Genus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" SERIAL NOT NULL,
    "scientificName" TEXT NOT NULL,
    "genusId" INTEGER NOT NULL,
    "range" TEXT,
    "IUCN" "IUCNCategory",
    "cornellLabCode" TEXT,
    "avibaseId" TEXT,
    "inatId" INTEGER,
    "ebirdCode" TEXT,
    "gbifId" INTEGER,
    "ncbiId" INTEGER,
    "birdlifeId" INTEGER,
    "macaulayCode" TEXT,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceUrl" (
    "id" SERIAL NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ResourceUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesName" (
    "id" SERIAL NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SpeciesName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "license_url" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "speciesId" INTEGER NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikipediaExtract" (
    "id" SERIAL NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "WikipediaExtract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_name_key" ON "Order"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Family_name_key" ON "Family"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genus_name_key" ON "Genus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Species_scientificName_key" ON "Species"("scientificName");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_name_key" ON "Resource"("name");

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Genus" ADD CONSTRAINT "Genus_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_genusId_fkey" FOREIGN KEY ("genusId") REFERENCES "Genus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUrl" ADD CONSTRAINT "ResourceUrl_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUrl" ADD CONSTRAINT "ResourceUrl_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesName" ADD CONSTRAINT "SpeciesName_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesName" ADD CONSTRAINT "SpeciesName_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikipediaExtract" ADD CONSTRAINT "WikipediaExtract_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikipediaExtract" ADD CONSTRAINT "WikipediaExtract_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
