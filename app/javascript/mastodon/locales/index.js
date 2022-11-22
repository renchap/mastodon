let theLocale;

import locale from 'react-intl/locale-data/en.js';

export function setLocale(locale) {
  theLocale = locale;
}

export function getLocale() {
  return locale;
}
