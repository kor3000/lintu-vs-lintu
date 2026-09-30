"use server";

import api from "./api/[[...route]]/route";

type OrderOption = { id: number; name: string };
type FamilyOption = { id: number; name: string };
type SearchOption = {
  id: number;
  scientificName: string;
  names: { name: string }[];
  genus: { name: string; family: { id: number } };
};
type SpeciesDetails = {
  id: number;
  scientificName: string;
  size: unknown;
  images: {
    url: string;
    attribution: string;
    license: { name: string; url: string };
  }[];
  genus: {
    name: string;
    family: { name: string; order: { name: string } };
  };
  names: { name: string }[];
};

const parseApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const getOrderOptions = async (): Promise<OrderOption[]> => {
  return parseApiResponse(await api.request("/api/orders"));
};

export const getFamilyOptions = async (orderId: number): Promise<FamilyOption[]> => {
  const query = new URLSearchParams({ orderId: String(orderId) });
  return parseApiResponse(await api.request(`/api/family?${query}`));
};

export const getSearchOptions = async (
  searchValue: string,
  languageCode: string,
  orderId?: number,
  familyId?: number
): Promise<SearchOption[]> => {
  if (searchValue.trim() === "") return [];

  const query = new URLSearchParams({ searchValue, languageCode });
  if (orderId !== undefined) query.set("orderId", String(orderId));
  if (familyId !== undefined) query.set("familyId", String(familyId));

  return parseApiResponse(await api.request(`/api/species/search?${query}`));
};

export const getSpeciesByIds = async (
  ids: number[],
  languageCode: string,
): Promise<SpeciesDetails[]> => {
  const query = new URLSearchParams({ ids: ids.join(","), languageCode });
  return parseApiResponse(await api.request(`/api/species?${query}`));
};