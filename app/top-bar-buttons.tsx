import React from "react";
import { MdiInformationOutline, MdiCog } from "./common/icons"
import { useModal } from "./modal-context";

const TopBarButtons = () => {
  const { activeModal, toggleModal } = useModal();

  return <div className="top-bar-button-container">
    <button
      className="button info-button"
      title="Info"
      type="button"
      aria-label="Information"
      aria-expanded={activeModal === "info"}
      onClick={() => toggleModal("info")}
    >
      <MdiInformationOutline />
    </button>
    <button
      className="button settings-button"
      title="Settings"
      type="button"
      aria-label="Settings"
      aria-expanded={activeModal === "settings"}
      onClick={() => toggleModal("settings")}
    >
      <MdiCog />
    </button>
  </div>;
};

export default TopBarButtons;