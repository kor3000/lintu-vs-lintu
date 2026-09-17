'use client'

import "./stylesheets/main.css";

import React, { useState } from "react";
import SpeciesContainer from "./species_container";
import SearchBar from "./search_bar";
import { SpeciesActionKind, SpeciesAction } from "./common/types";

const commonNameLang = 'fi';

export default function Home() {
  const [selectedSpecies, setSelectedSpecies] = useState<number[]>([]);
  const [lastSpeciesAction, setlastSpeciesAction] = useState<SpeciesAction | null>(null);

  const changeSelectedSpecies = (id: number) => {
    const newIds = [...selectedSpecies];
    const idx = newIds.findIndex((i) => i === id);

    if (idx === -1) {
      newIds.push(id);
    } else {
      newIds.splice(idx, 1);
    }

    // console.log('id list change (idx:', idx, 'id:', id, ')', newIds);
    setSelectedSpecies(newIds);
    setlastSpeciesAction({
      type: (idx === -1) ? SpeciesActionKind.ADD : SpeciesActionKind.REMOVE,
      id: id
    })
  }

  return (
    <div className="lintu-container">
      <div className="search-container">
        <SearchBar
          changeSpecies={changeSelectedSpecies}
          nameLang={commonNameLang}
        />
      </div>
      <div className="data-container">
        <SpeciesContainer
          // selectedSpecies={selectedSpecies}
          speciesAction={lastSpeciesAction}
          changeSpecies={changeSelectedSpecies}
          nameLang={commonNameLang}
        />
      </div>
    </div>
  );
}
