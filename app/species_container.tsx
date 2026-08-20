import Image from "next/image";
import React, { useReducer, useEffect } from "react";
import { mockSpecies } from "./mock_data/mock_species"
import { SpeciesData, SizeData, SpeciesActionKind, SpeciesAction } from "./common/types";

type SpeciesContainerProps = {
  // selectedSpecies: number[]
  speciesAction: SpeciesAction | null;
  changeSpecies: (id: number) => void;
}

const speciesReducer = (state: SpeciesData[], action: SpeciesAction) => {
  const newState = [...state];

  if (action.type === SpeciesActionKind.ADD) {
    // console.log('adding', action.id);
    const newSpecies = mockSpecies.find((s) => s.id === action.id);
    if (newSpecies) newState.push(newSpecies);
  } else {
    const idx = newState.findIndex((s) => s.id === action.id);
    // console.log('removing', action.id, idx);
    if (idx !== -1) newState.splice(idx, 1);
  }

  return newState;
};

const SpeciesContainer = (props: SpeciesContainerProps) => {
  const [speciesState, dispatch] = useReducer(speciesReducer, []);
  // const testSpecies: SpeciesData[] = mockSpecies;

  useEffect(() => {
    if (!props.speciesAction) return;

    dispatch(props.speciesAction);
  }, [props.speciesAction]);

  const renderSizeData = (type: string, size: SizeData | undefined) => {
    const label = <b>{type}:</b>;
    const value = size
      ? `${size.min}–${size.max} ${size.unit}`
      : <span className="not-available">(not available)</span>;

    return <p>{label} {value}</p>;
  }

  const renderSpecies = () => {
    return speciesState.map((s) => {
      const key = `bird-${s.species}`;
      const nameLatin = `${s.genus} ${s.species}`;
      return (
        <div key={key} className="species-container">
          <div className="species-name-container">
            <div
              className="close-button"
              title="Remove from comparison"
              onMouseUp={() => props.changeSpecies(s.id)}
            >
              <p>✕</p>
            </div>
            <div className="species-name">
              <h1>{s.name_eng}</h1>
              <h2><i>({nameLatin})</i></h2>
            </div>
          </div>
          {s.images?.[0]?.url && (
            <div className="species-image">
              <a
                href={s.images[0].license_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Click to view image license_url"
              >
                <Image
                  src={s.images[0].url}
                  alt={`${s.name_eng} (${nameLatin})`}
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                  sizes="35vw"
                />
              </a>
            </div>
          )}
          <div className="species-subheader">
            Scientific classification
          </div>
          <div className="species-content">
            <p><b>Family:</b> {s.family}</p>
            <p><b>Order:</b> {s.order}</p>
          </div>
          <div className="species-subheader">
            Size
          </div>
          <div className="species-content">
            {renderSizeData("Length", s.length)}
            {renderSizeData("Wingspan", s.wingspan)}
            {renderSizeData("Weight", s.weight)}
          </div>
        </div>
      )
    })
  };

  return renderSpecies();
};

export default SpeciesContainer;