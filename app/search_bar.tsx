import React, { useEffect, useRef, useState } from "react";
import { classifications, mockSpecies } from "./mock_data/mock_species"

type SearchOption = {
  id: number;
  name: string;
  family: string;
}

const searchOptions: SearchOption[] = mockSpecies.map((s) => {
  return {
      id: s.id,
      name: `${s.name_eng} (${s.genus} ${s.species})`,
      family: s.family
    }
});

type FamilyOption = {
  orderName: string;
  familyName: string;
}

const familyOptions: FamilyOption[] = [];
classifications.forEach((c) => {
  c.families.forEach((f) => {
    familyOptions.push({
      orderName: c.name,
      familyName: f.name
    });
  });
});

type SearchBarProps = {
  changeSpecies: (id: number) => void;
};

const SearchBar = (props: SearchBarProps) => {
  const [searchInput, setSearchInput] = useState<string>('');
  const [filterOptions, setFilterOptions] = useState<SearchOption[]>([]);
  const [showFilterOptions, setShowFilterOptions] = useState<boolean>(true);
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const searchInputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (searchInputRef.current && target && !searchInputRef.current.contains(target)) {
        setShowFilterOptions(false);
      } else {
        setShowFilterOptions(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateFilterOptions = (searchValue: string, familyValue: string) => {
    setFilterOptions(
      searchOptions.filter((opt) => {
        const matchesName = opt.name.toLowerCase().includes(searchValue.toLowerCase());
        const matchesFamily = familyValue === '' || opt.family === familyValue;
        return matchesName && matchesFamily;
      })
    );
  };

  const listFilterOptions = () => {
    if (!showFilterOptions || searchInput === '' || filterOptions.length === 0)
      return null;

    return (
      <div className="search-filter">
        <ul>
          {filterOptions.map((opt) => (
            <li key={`bird-opt-${opt.id}`}>
              <div
                className="search-filter-item"
                title="Add to comparison"
                onMouseUp={() => props.changeSpecies(opt.id)}
              >
                {opt.name}
                <div className="select-button">+</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="search-widget">
      <div className="search-dropdown">
        <select
          value={selectedFamily}
          onChange={(e) => {
            const familyValue = e.target.value;
            setSelectedFamily(familyValue);
            updateFilterOptions(searchInput, familyValue);
          }}
        >
          <option value="">All families</option>
          {familyOptions.map((f, i) => (
            <option key={`family-option-${i}`} value={f.familyName}>
              {f.orderName} / {f.familyName}
            </option>
          ))}
        </select>
      </div>
      <div className="search-input" ref={searchInputRef}>
        <input
          type="text"
          placeholder="Search for a species..."
          value={searchInput}
          onChange={(e) => {
            const v = e.target.value;
            setSearchInput(v);
            updateFilterOptions(v, selectedFamily);
          }}
        />
        {listFilterOptions()}
      </div>
    </div>
  );
};

export default SearchBar;