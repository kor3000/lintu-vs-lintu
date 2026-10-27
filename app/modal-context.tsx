'use client';

import React, { createContext, useContext, useEffect, useState, useRef, RefObject } from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ModalDialog, { ModalDialogProps } from 'react-bootstrap/ModalDialog';
import Draggable from 'react-draggable';
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

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

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

  if (activeModal === "info") {
    modalTitle = "Information";
    modalContent = infoContent(closeModal);
  } else if (activeModal === "settings") {
    modalTitle = "Settings";
    modalContent = settingsContent(closeModal);
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
        {modalContent}
      </Modal>
        /*<div
          className="modal-overlay"
          onClick={closeModal}
        >
          <section
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <h2 id="modal-title">{modalTitle}</h2>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close modal"
                onClick={closeModal}
              >
                <MaterialSymbolsClose />
              </button>
            </header>
          </section>
        </div>*/
      )}
    </ModalContext.Provider>
  );
}

const infoContent = (onHide: () => void) => (
  <>
    <Modal.Body>
      <p>LINTU vs LINTU is a bird species comparison tool.</p>
      <p>
        <a 
          href="https://github.com/kor3000/lintu-vs-lintu"
          target="_blank"
          rel="noopener noreferrer"
          title="LINTU vs LINTU Github page"
        >
          Github page
        </a>
      </p>
      <p>Data for the project is gathered using the
        {' '}
        <a 
          href="https://github.com/birdnet-team/birdnet-taxonomy"
          target="_blank"
          rel="noopener noreferrer"
          title="BirdNET+ Taxonomy Github page"
        >
          BirdNET+ Taxonomy pipeline
        </a>
        .
      </p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="primary" onClick={onHide}>
        Close
      </Button>
    </Modal.Footer>
  </>
);

const settingsContent = (onHide: () => void) => (
  <>
    <Modal.Body>
      <p>TBD</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Close
      </Button>
      <Button variant="primary" onClick={onHide}>
        Save Changes
      </Button>
    </Modal.Footer>
  </>
);
