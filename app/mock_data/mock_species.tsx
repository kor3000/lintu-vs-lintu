import { SpeciesData, ClassOrder } from "../common/types";

export const classifications: ClassOrder[] = [
  {
    id: 101,
    name: "Passeriformes",
    families: [
      {
        id: 201,
        name: "Muscicapidae",
        genera: [
          {
            id: 301,
            name: "Oenanthe"
          },
          {
            id: 302,
            name: "Saxicola"
          } 
        ]
      }
    ]
  },
  {
    id: 102,
    name: "Charadriiformes",
    families: [
      {
        id: 202,
        name: "Scolopacidae",
        genera: [
          {
            id: 303,
            name: "Tringa"
          },
          {
            id: 304,
            name: "Xenus"
          }
        ]
      },
      {
        id: 203,
        name: "Laridae",
        genera: [
          {
            id: 305,
            name: "Larus" 
          },
          {
            id: 306,
            name: "Chroicocephalus"
          },
          {
            id: 307,
            name: "Hydrocoloeus"
          }
        ]
      }
    ]
  }
];

export const mockSpecies: SpeciesData[] = [
  {
    id: 1,
    name_fi: "Kivitasku",
    name_eng: "Northern wheatear",
    species: "oenanthe",
    genus: "Oenanthe",
    family: "Muscicapidae",
    order: "Passeriformes",
    length: {
      min: 14.5,
      max: 16,
      unit: "cm"
    },
    wingspan: {
      min: 26,
      max: 32,
      unit: "cm"
    },
    weight: {
      min: 17,
      max: 30,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Steinschmaetzer_Northern_wheatear_male.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Steinschmaetzer_Northern_wheatear_male.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/1/17/Northern_wheatear_Oenanthe_oenanthe.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Northern_wheatear_Oenanthe_oenanthe.jpg"
      }
    ]
  },
  {
    id: 2,
    name_fi: "Pensastasku",
    name_eng: "Whinchat",
    species: "rubetra",
    genus: "Saxicola",
    family: "Muscicapidae",
    order: "Passeriformes",
    length: {
      min: 12,
      max: 14,
      unit: "cm"
    },
    weight: {
      min: 15,
      max: 18,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Tarier_des_pr%C3%A8s_Zaghouan_NP001.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Tarier_des_pr%C3%A8s_Zaghouan_NP001.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/0/02/Whinchat_(Saxicola_rubetra)_Uganda.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Whinchat_(Saxicola_rubetra)_Uganda.jpg"
      }
    ]
  },
  {
    id: 3,
    name_fi: "Sepeltasku",
    name_eng: "Siberian stonechat",
    species: "maurus",
    genus: "Saxicola",
    family: "Muscicapidae",
    order: "Passeriformes",
    length: {
      min: 12.5,
      max: 13,
      unit: "cm"
    },
    wingspan: {
      min: 18,
      max: 21,
      unit: "cm"
    },
    weight: {
      min: 14,
      max: 17,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Siberian_stonechat_(Saxicola_maurus)_male_non-breeding.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Siberian_stonechat_(Saxicola_maurus)_male_non-breeding.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/1/14/Siberian_stonechat_-_Jamnagar%252C_Gujarat_2020-11-10.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Siberian_stonechat_-_Jamnagar%252C_Gujarat_2020-11-10.jpg"
      }
    ]
  },
  {
    id: 4,
    name_fi: "Lampiviklo",
    name_eng: "Marsh sandpiper",
    species: "stagnatilis",
    genus: "Tringa",
    family: "Scolopacidae",
    order: "Charadriiformes",
    length: {
      min: 22,
      max: 26,
      unit: "cm"
    },
    wingspan: {
      min: 55,
      max: 59,
      unit: "cm"
    },
    weight: {
      min: 45,
      max: 120,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Tringa_stagnatilis_2_-_Laem_Pak_Bia.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Tringa_stagnatilis_2_-_Laem_Pak_Bia.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/0/06/Marsh_sandpiper(Tringa_stagnatilis)_2.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Marsh_sandpiper(Tringa_stagnatilis)_2.jpg"
      }
    ]
  },
  {
    id: 5,
    name_fi: "Metsäviklo",
    name_eng: "Green sandpiper",
    species: "ochropus",
    genus: "Tringa",
    family: "Scolopacidae",
    order: "Charadriiformes",
    length: {
      min: 20,
      max: 24,
      unit: "cm"
    },
    wingspan: {
      min: 39,
      max: 44,
      unit: "cm"
    },
    weight: {
      min: 50,
      max: 120,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/9/92/Green-Sandpiper-Sandeep.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Green-Sandpiper-Sandeep.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/1/19/Green_Sandpiper_(Tringa_ochropus)_(30725772867).jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Green_Sandpiper_(Tringa_ochropus)_(30725772867).jpg"
      }
    ]
  },
  {
    id: 6,
    name_fi: "Liro",
    name_eng: "Wood sandpiper",
    species: "glareola",
    genus: "Tringa",
    family: "Scolopacidae",
    order: "Charadriiformes",
    length: {
      min: 18.5,
      max: 21,
      unit: "cm"
    },
    wingspan: {
      min: 35,
      max: 39,
      unit: "cm"
    },
    weight: {
      min: 50,
      max: 90,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Tringa_glareola_-_Laem_Phak_Bia.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Tringa_glareola_-_Laem_Phak_Bia.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/8/87/Wood_Sandpiper_Safari_Park.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Wood_Sandpiper_Safari_Park.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Wood_Sandpiper_Photograph_By_Shantanu_Kuveskar.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Wood_Sandpiper_Photograph_By_Shantanu_Kuveskar.jpg"
      }
    ]
  },
  {
    id: 7,
    name_fi: "Valkoviklo",
    name_eng: "Common greenshank",
    species: "nebularia",
    genus: "Tringa",
    family: "Scolopacidae",
    order: "Charadriiformes",
    length: {
      min: 30,
      max: 35,
      unit: "cm"
    },
    wingspan: {
      min: 68,
      max: 70,
      unit: "cm"
    },
    weight: {
      min: 125,
      max: 290,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Common_greenshank_(Tringa_nebularia)_Bahrain.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Common_greenshank_(Tringa_nebularia)_Bahrain.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Tringa_nebularia_(Marek_Szczepanek).jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Tringa_nebularia_(Marek_Szczepanek).jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Common-Greenshank.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Common-Greenshank.jpg"
      }
    ]
  },
  {
    id: 8,
    name_fi: "Punajalkaviklo",
    name_eng: "Common redshank",
    species: "totanus",
    genus: "Tringa",
    family: "Scolopacidae",
    order: "Charadriiformes",
    length: {
      min: 26,
      max: 31,
      unit: "cm"
    },
    wingspan: {
      min: 40,
      max: 65,
      unit: "cm"
    },
    weight: {
      min: 85,
      max: 170,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Common_redshank_(Tringa_totanus)_breeding_Marken.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Common_redshank_(Tringa_totanus)_breeding_Marken.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/0/01/Common_redshank_(Tringa_totanus)_Bahrain.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Common_redshank_(Tringa_totanus)_Bahrain.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/0/0d/Rotschenkel_Pfahl_%C3%9Cberblick.JPG",
        license_url: "https://commons.wikimedia.org/wiki/File:Rotschenkel_Pfahl_%C3%9Cberblick.JPG"
      }
    ]
  },
  {
    id: 9,
    name_fi: "Rantakurvi",
    name_eng: "Terek sandpiper",
    species: "cinereus",
    genus: "Xenus",
    family: "Scolopacidae",
    order: "Charadriiformes",
    length: {
      min: 22,
      max: 27,
      unit: "cm"
    },
    wingspan: {
      min: 36,
      max: 45,
      unit: "cm"
    },
    weight: {
      min: 50,
      max: 95,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Terek_Sandpiper_(Xenus_cinereus)_(53969645800).jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Terek_Sandpiper_(Xenus_cinereus)_(53969645800).jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Xenus_cinereus_Lapland.JPG",
        license_url: "https://commons.wikimedia.org/wiki/File:Xenus_cinereus_Lapland.JPG"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/0/06/Terek_Sandpiper_AMSM5480_TSAN.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Terek_Sandpiper_AMSM5480_TSAN.jpg"
      }
    ]
  },
  {
    id: 10,
    name_fi: "Kalalokki",
    name_eng: "Common gull",
    species: "canus",
    genus: "Larus",
    family: "Laridae",
    order: "Charadriiformes",
    length: {
      min: 40,
      max: 45,
      unit: "cm"
    },
    wingspan: {
      min: 100,
      max: 110,
      unit: "cm"
    },
    weight: {
      min: 300,
      max: 600,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Larus_canus_Common_Gull_in_Norway.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Larus_canus_Common_Gull_in_Norway.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Kalalokki_wiki-01.jpg",
        license_url: "https://commons.wikimedia.org/wiki/File:Kalalokki_wiki-01.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Common_gull_(Larus_canus)_adult_breeding_in_flight_Oppdal.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Common_gull_(Larus_canus)_adult_breeding_in_flight_Oppdal.jpg"
      }
    ]
  },
  {
    id: 11,
    name_fi: "Harmaalokki",
    name_eng: "European herring gull",
    species: "argentatus",
    genus: "Larus",
    family: "Laridae",
    order: "Charadriiformes",
    length: {
      min: 54,
      max: 65,
      unit: "cm"
    },
    wingspan: {
      min: 123,
      max: 158,
      unit: "cm"
    },
    weight: {
      min: 710,
      max: 1100,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/4/46/2016.07.16.-12-Kiellinie_Kiel--Silbermoewe.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:2016.07.16.-12-Kiellinie_Kiel--Silbermoewe.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/4/4f/European_herring_gull_(Larus_argentatus)_juvenile.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:European_herring_gull_(Larus_argentatus)_juvenile.jpg"
      }
    ]
  },
  {
    id: 12,
    name_fi: "Selkälokki",
    name_eng: "Lesser black-backed gull",
    species: "fuscus",
    genus: "Larus",
    family: "Laridae",
    order: "Charadriiformes",
    length: {
      min: 48,
      max: 56,
      unit: "cm"
    },
    wingspan: {
      min: 117,
      max: 134,
      unit: "cm"
    },
    weight: {
      min: 640,
      max: 930,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Selk%C3%A4lokki.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Selk%C3%A4lokki.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/4/45/Silltrut-Larus_fuscus-1cy-Ystad-2009.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Silltrut-Larus_fuscus-1cy-Ystad-2009.jpg"
      }
    ]
  },
  {
    id: 13,
    name_fi: "Merilokki",
    name_eng: "Great black-backed gull",
    species: "marinus",
    genus: "Larus",
    family: "Laridae",
    order: "Charadriiformes",
    length: {
      min: 61,
      max: 74,
      unit: "cm"
    },
    wingspan: {
      min: 140,
      max: 170,
      unit: "cm"
    },
    weight: {
      min: 750,
      max: 2300,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Larus_marinus_watching.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Larus_marinus_watching.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/d/de/Sopot_mewa.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Sopot_mewa.jpg"
      }
    ]
  },
  {
    id: 14,
    name_fi: "Naurulokki",
    name_eng: "Black-headed gull",
    species: "ridibundus",
    genus: "Chroicocephalus",
    family: "Laridae",
    order: "Charadriiformes",
    length: {
      min: 38,
      max: 44,
      unit: "cm"
    },
    wingspan: {
      min: 94,
      max: 105,
      unit: "cm"
    },
    weight: {
      min: 166,
      max: 400,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/2/29/Chroicocephalus_ridibundus_(summer).jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Chroicocephalus_ridibundus_(summer).jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Black-headed_gull_(05557).jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Black-headed_gull_(05557).jpg"
      }
    ]
  },
  {
    id: 15,
    name_fi: "Pikkulokki",
    name_eng: "Little gull",
    species: "minutus",
    genus: "Hydrocoloeus",
    family: "Laridae",
    order: "Charadriiformes",
    length: {
      min: 24,
      max: 28,
      unit: "cm"
    },
    wingspan: {
      min: 62,
      max: 69,
      unit: "cm"
    },
    weight: {
      min: 90,
      max: 160,
      unit: "g"
    },
    images: [
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/5/50/%C4%8Cajka_mal%C3%A1_(Larus_minutus)_a_(4834254958).jpg",
        license_url: "https://en.wikipedia.org/wiki/File:%C4%8Cajka_mal%C3%A1_(Larus_minutus)_a_(4834254958).jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/d/da/Hydrocoloeus_minutus_Russia_10.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Hydrocoloeus_minutus_Russia_10.jpg"
      },
      {
        id: 1,
        url: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Bird_Yyterin_lietteet_4.jpg",
        license_url: "https://en.wikipedia.org/wiki/File:Bird_Yyterin_lietteet_4.jpg"
      }
    ]
  }
];
