'use client';

import React, { createContext, useContext, useEffect, useState, useRef, RefObject } from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ModalDialog, { ModalDialogProps } from 'react-bootstrap/ModalDialog';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Draggable from 'react-draggable';
import { Trans, useT, useChangeLanguage } from 'next-i18next/client';
import { uiLanguages, type UiLanguage } from '../i18n.config';
import { MaterialSymbolsClose } from "./common/icons"

type ModalType = "info" | "settings";

type ModalContextValue = {
  activeModal: ModalType | null;
  toggleModal: (modal: ModalType) => void;
  closeModal: () => void;
};

export interface DraggableModalDialogProps extends ModalDialogProps {
  nodeRef?: RefObject<HTMLElement>;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}

const DraggableModalDialog = ({ nodeRef, ...props }: DraggableModalDialogProps) => {
  return (
    <Draggable nodeRef={nodeRef}>
      <ModalDialog {...props} />
    </Draggable>
  );
};

const findInitialLanguage = (code: string) => {
  const lang = uiLanguages.find((l) => l.code === code);
  if (lang) return lang;

  return { code: 'en', localName: 'English' };
}

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const { t, i18n } = useT();
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [selectedLang, setSelectedLang] = useState<UiLanguage>(findInitialLanguage(i18n.language));
  const nodeRef = useRef<HTMLDivElement>(null);
  const changeLanguage = useChangeLanguage()

  const closeModal = () => setActiveModal(null);
  const toggleModal = (modal: ModalType) => {
    setActiveModal((currentModal) => currentModal === modal ? null : modal);
  };

  useEffect(() => {
    if (!activeModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal]);

  let modalTitle: string = '';
  let modalContent: React.JSX.Element | null = null;
  let modalFooter: React.JSX.Element | null = null;
  const closeBtn = (isPrimary = true) => (
    <Button variant={isPrimary ? "primary" : "secondary"} onClick={closeModal}>
      {t('close')}
    </Button>
  );

  if (activeModal === "info") {
    modalTitle = t('info');
    const aProps = { target: "_blank", rel: "noopener noreferrer" };
    modalContent = (
      <>
        <p>
          <Trans
            t={t}
            i18nKey="info_modal.p1"
            components={{ anchor: <a {...aProps} href="https://github.com/kor3000/lintu-vs-lintu" title={t('info_modal.lintu_link_title')} /> }}
          />
        </p>
        <p>
          <Trans
            t={t}
            i18nKey="info_modal.p2"
            components={{ anchor: <a {...aProps} href="https://github.com/birdnet-team/birdnet-taxonomy" title={t('info_modal.birdnet_link_title')} /> }}
          />
        </p>
      </>
    );
    modalFooter = closeBtn();
  } else if (activeModal === "settings") {
    modalTitle = t('settings');
    modalContent = (
      <div className="dropdown-container">
        <div>{t('settings_modal.select_ui_lang')}</div>
        <DropdownButton
          id="dropdown-basic-button"
          title={selectedLang.localName}
          onSelect={(key) => {
            if (!key) return;

            const lang = uiLanguages.find((l) => l.code === key);
            if (lang) {
              setSelectedLang(lang);
            }
          }}
        >
          {uiLanguages.map((l) => (
            <Dropdown.Item
              key={`lang-${l.code}`}
              eventKey={l.code}
              active={l.code === selectedLang.code}
            >
              {l.localName}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </div>
    );
    const saveChanges = () => {
      changeLanguage(selectedLang.code);
      closeModal();
    };
    modalFooter = (
      <>
        {closeBtn(false)}
        <Button variant="primary" onClick={saveChanges}>
          {t('save_changes')}
        </Button>
      </>
    );
  }

  return (
    <ModalContext.Provider value={{ activeModal, toggleModal, closeModal }}>
      {children}
      {activeModal && (
        <Modal
          show={!!activeModal}
          onHide={closeModal}
          centered={true}
          nodeRef={nodeRef}
          dialogAs={DraggableModalDialog}
          backdrop
        >
        <Modal.Header ref={nodeRef}>
          <Modal.Title>{modalTitle}</Modal.Title>
          <button
            className="modal-close-button close-button"
            type="button"
            aria-label="Close modal"
            onClick={closeModal}
          >
            <MaterialSymbolsClose />
          </button>
        </Modal.Header>
        <Modal.Body>{modalContent}</Modal.Body>
        <Modal.Footer>{modalFooter}</Modal.Footer>
      </Modal>
      )}
    </ModalContext.Provider>
  );
};
