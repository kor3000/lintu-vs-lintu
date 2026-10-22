'use client'

import "./stylesheets/main.css";

import React from "react";
import SpeciesContainer from "./species_container";
import SearchBar from "./search_bar";

export default function Home() {
  return (
    <div className="lintu-container">
      <div className="search-container">
        <SearchBar />
      </div>
      <div className="data-container">
        <SpeciesContainer />
      </div>
    </div>
  );
}
