import { Declarations } from '@glitz/type';

export function parseDeclarationBlock(declarations: Declarations) {
  let block = '';
  let property: string;
  for (property in declarations) {
    const value = declarations[property];
    if (typeof value === 'object') {
      for (const fallback of value) {
        if (block) {
          block += ';';
        }
        block += parseDeclaration(property, fallback);
      }
    } else {
      if (block) {
        block += ';';
      }
      block += parseDeclaration(property, value);
    }
  }
  return block;
}

export function parseDeclaration(property: string, value?: string | number) {
  if (process.env.NODE_ENV !== 'production') {
    if (!(typeof value === 'string' || typeof value === 'number')) {
      console.error('The style value %O of property `%s` has to be a string, number', value, property);
    }
    if (value === '') {
      console.warn('Style property `%s` as empty string may cause some unexpected behavior', property);
    }
    if (typeof value === 'number' && Number.isNaN(value)) {
      console.warn('Style property `%s` as NaN may cause some unexpected behavior', property);
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      console.warn('Style property `%s` as an infinite number may cause some unexpected behavior', property);
    }
  }
  return `${hyphenateProperty(property)}:${value}`;
}

// Accept both camel cased and capitalized vendor properties
const hyphenateRegex = /(?:^(ms|moz|webkit))|[A-Z]/g;
const propertyCache: { [property: string]: string } = {};

export function hyphenateProperty(property: string) {
  return property in propertyCache
    ? propertyCache[property]
    : (propertyCache[property] = property.replace(hyphenateRegex, '-$&').toLowerCase());
}
