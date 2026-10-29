import React from "react";
import { useT } from 'next-i18next/client';
import { MdiInformationOutline, MdiCog } from "./common/icons"
import { useModal } from "./modal-context";

const TopBarButtons = () => {
  const { activeModal, toggleModal } = useModal();
  const { t } = useT();

  return <div className="top-bar-button-container">
    <button
      className="button info-button"
      title={t('info')}
      type="button"
      aria-label={t('info')}
      aria-expanded={activeModal === "info"}
      onClick={() => toggleModal("info")}
    >
      <MdiInformationOutline />
    </button>
    <button
      className="button settings-button"
      title={t('settings')}
      type="button"
      aria-label={t('settings')}
      aria-expanded={activeModal === "settings"}
      onClick={() => toggleModal("settings")}
    >
      <MdiCog />
    </button>
  </div>;
};

export default TopBarButtons;