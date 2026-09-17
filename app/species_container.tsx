import Image from "next/image";
import React, { useEffect } from "react";
import { getSpeciesByIds } from "./actions";
import { /*SizeData,*/ SpeciesActionKind, SpeciesAction } from "./common/types";

type SpeciesContainerProps = {
  // selectedSpecies: number[]
  speciesAction: SpeciesAction | null;
  changeSpecies: (id: number) => void;
  nameLang: string;
}

type DatabaseSpecies = Awaited<ReturnType<typeof getSpeciesByIds>>[number];
type SpeciesStateAction =
  | { type: "add"; species: DatabaseSpecies }
  | { type: "remove"; id: number };

const speciesReducer = (
  state: DatabaseSpecies[],
  action: SpeciesStateAction
) => {
  if (action.type === "remove") {
    return state.filter((species) => species.id !== action.id);
  }

  return state.some((species) => species.id === action.species.id)
    ? state
    : [...state, action.species];
};

const SpeciesContainer = (props: SpeciesContainerProps) => {
  const [speciesState, dispatch] = React.useReducer(speciesReducer, []);

  const nameLang = props.nameLang;

  useEffect(() => {
    if (!props.speciesAction) return;

    if (props.speciesAction.type === SpeciesActionKind.REMOVE) {
      dispatch({ type: "remove", id: props.speciesAction.id });
      return;
    }

    getSpeciesByIds([props.speciesAction.id], nameLang).then((species) => {
      if (species.length === 0) return;
      dispatch({ type: "add", species: species[0] });
    });
  }, [props.speciesAction, nameLang]);

  /*const renderSizeData = (type: string, size: SizeData | undefined) => {
    const label = <b>{type}:</b>;
    const value = size
      ? `${size.min}–${size.max} ${size.unit}`
      : <span className="not-available">(not available)</span>;

    return <p>{label} {value}</p>;
  }*/

  const renderSpecies = () => {
    return speciesState.map((s) => {
      const key = `bird-${s.id}`;
      const nameLatin = s.scientificName;
      const name = s.names[0]?.name ?? nameLatin;
      /*const size = s.size as {
        length?: SizeData;
        wingspan?: SizeData;
        weight?: SizeData;
      };*/
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
              <h1>{name}</h1>
              <h2><i>({nameLatin})</i></h2>
            </div>
          </div>
          {s.images[0]?.url && (
            <div className="species-image">
              <a
                href={s.images[0].license.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${s.images[0].attribution}. Click to view license.`}
              >
                <Image
                  src={s.images[0].url}
                  alt={`${name} (${nameLatin})`}
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
            <p><b>Family:</b> {s.genus.family.name}</p>
            <p><b>Order:</b> {s.genus.family.order.name}</p>
          </div>
          {/*<div className="species-subheader">
            Size
          </div>
          <div className="species-content">
            {renderSizeData("Length", size.length)}
            {renderSizeData("Wingspan", size.wingspan)}
            {renderSizeData("Weight", size.weight)}
          </div>*/}
        </div>
      )
    })
  };

  return renderSpecies();
};

export default SpeciesContainer;