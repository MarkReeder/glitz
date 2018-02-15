import Injector from '../core/Injector';
import { formatClassRule, formatFontFaceRule, formatKeyframesRule } from '../utils/format';
import { createHashCounter } from '../utils/hash';

export default class InjectorServer extends Injector {
  public getStyle: () => void;
  constructor(
    incrementClassHash = createHashCounter(),
    incrementKeyframesHash = createHashCounter(),
    incrementFontFaceHash = createHashCounter(),
  ) {
    const plainDictionary: { [block: string]: string } = {};
    const pseudoDictionary: { [pseudo: string]: { [block: string]: string } } = {};
    const keyframesDictionary: { [block: string]: string } = {};
    const fontFaceDictionary: { [block: string]: string } = {};

    super(
      plainDictionary,
      pseudoDictionary,
      keyframesDictionary,
      fontFaceDictionary,
      incrementClassHash,
      incrementKeyframesHash,
      incrementFontFaceHash,
    );

    this.getStyle = () => {
      let style = '';
      for (const block in plainDictionary) {
        style += formatClassRule(plainDictionary[block], block);
      }
      for (const pseudo in pseudoDictionary) {
        const dictionary = pseudoDictionary[pseudo];
        for (const block in dictionary) {
          style += formatClassRule(dictionary[block], block, pseudo);
        }
      }
      for (const blockList in keyframesDictionary) {
        style += formatKeyframesRule(keyframesDictionary[blockList], blockList);
      }
      for (const block in fontFaceDictionary) {
        style += formatFontFaceRule(block);
      }
      return style;
    };
  }
}
