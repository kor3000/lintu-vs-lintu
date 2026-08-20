export type SizeData = {
  min: number;
  max: number;
  unit: string;
};

type ImageData = {
  id: number;
  url: string;
  license?: string;
  license_url: string;
  attribution?: string;
}

export type SpeciesData = {
  id: number;
  name_fi: string;
  name_eng: string;
  species: string;
  genus: string;
  family: string;
  order: string;
  length?: SizeData;
  wingspan?: SizeData
  weight?: SizeData;
  images: ImageData[];
};

type Language = {
  id: number;
  code: string;
  name: string;
}

type SpeciesName = {
  id: number;
  language: Language;
  name: string;
}

type Resource = {
  id: number;
  name: string;
}

type ResourceUrl = {
  id: number;
  resource: Resource;
  url: string
}

type WikipediaExtract = {
  id: number;
  language: Language;
  text: string;
  url: string;
}

type SizeJson = {
  length: SizeData;
  wingspan: SizeData;
  weight: SizeData;
}

export type Species = {
  id: number;
  scientificName: string | null;
  genus: ClassGenus;
  range: string | null;
  IUCN: 'EX' | 'EW' | 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | null;
  cornellLabCode: string | null;
  avibaseId: string | null;
  inatId: number | null;
  ebirdCode: string | null;
  gbifId: number | null;
  ncbiId: number | null;
  birdlifeId: number | null;
  macaulayCode: string | null;
  images: ImageData[];
  resourceUrls: ResourceUrl[];
  names: SpeciesName[];
  extracts: WikipediaExtract[];
  size: SizeJson;
}

type ClassGenus = {
  id: number;
  name: string;
};
type ClassFamily = {
  id: number;
  name: string;
  genera: ClassGenus[];
};
export type ClassOrder = {
  id: number;
  name: string;
  families: ClassFamily[];
};

export enum SpeciesActionKind {
  ADD = 'add',
  REMOVE = 'remove',
}

export type SpeciesAction = {
  type: SpeciesActionKind;
  id: number;
}