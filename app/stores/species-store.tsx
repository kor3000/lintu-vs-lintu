import { SpeciesAction, SpeciesActionKind } from "../common/types";

type Observer = {
  update: (action: SpeciesAction) => void
};

class SpeciesStore {
  observers: Array<Observer>;
  lastAction: SpeciesAction | null;
  selectedIds: number[];

  constructor() {
    this.observers = [];
    this.lastAction = null;
    this.selectedIds = [];
  }

  // Register observer
  addObserver(observer: Observer) {
    this.observers.push(observer);
  }

  // Remove observer
  removeObserver(observer: Observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  // Add or remove species by id from the selected species list
  changeSelectedSpecies(id: number) {
    const newIds = [...this.selectedIds];
    const idx = newIds.findIndex((i) => i === id);

    if (idx === -1) {
      newIds.push(id);
    } else {
      newIds.splice(idx, 1);
    }

    this.selectedIds = newIds;
    this.setLastAction({
      type: (idx === -1) ? SpeciesActionKind.ADD : SpeciesActionKind.REMOVE,
      id: id
    });
  };

  // Update lastAction and notify observers
  setLastAction(action: SpeciesAction) {
    this.lastAction = action;
    this.observers.forEach(observer => observer.update(action));
  }
}

const speciesStore = new SpeciesStore();

export default speciesStore;
