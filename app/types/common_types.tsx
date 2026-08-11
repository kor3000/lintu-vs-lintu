export type SizeData = {
  min: number;
  max: number;
  unit: string;
};

type ImageData = {
  url: string;
  license: string;
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

type ClassGenera = {
  id: number;
  name: string;
};
type ClassFamilies = {
  id: number;
  name: string;
  genera: ClassGenera[];
};
export type ClassOrders = {
  id: number;
  name: string;
  families: ClassFamilies[];
};

export enum SpeciesActionKind {
  ADD = 'add',
  REMOVE = 'remove',
}

export type SpeciesAction = {
  type: SpeciesActionKind;
  id: number;
}