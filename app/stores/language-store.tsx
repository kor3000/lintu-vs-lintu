type Observer = {
  update: (lang: string) => void
};

class LanguageStore {
  uiObservers: Observer[];
  nameObservers: Observer[];
  uiLang: string;
  nameLang: string;

  constructor() {
    this.uiObservers = [];
    this.nameObservers = [];
    this.uiLang = 'en';
    this.nameLang = 'fi';
  }

  // Register observer
  addObserver(observer: Observer, names = true, ui = false) {
    if (names) this.nameObservers.push(observer);
    if (ui) this.uiObservers.push(observer);
  }

  // Remove observer
  removeObserver(observer: Observer) {
    this.nameObservers = this.nameObservers.filter(obs => obs !== observer);
  }

  setUILang(lang: string) {
    this.uiLang = lang;
    this.uiObservers.forEach(obs => obs.update(this.uiLang));
  }

  setNameLang(lang: string) {
    this.nameLang = lang;
    this.nameObservers.forEach(obs => obs.update(this.nameLang));
  }
}

const languageStore = new LanguageStore();

export default languageStore;
