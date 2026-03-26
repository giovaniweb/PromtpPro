export type { StyleItem } from './styles';
export { styles as stylesEditorial } from './styles';
export { stylesCorporativo } from './styles-corporativo';
export { stylesSocial } from './styles-social';
export { stylesArtistico } from './styles-artistico';
export { stylesProduto } from './styles-produto';

import { styles } from './styles';
import { stylesCorporativo } from './styles-corporativo';
import { stylesSocial } from './styles-social';
import { stylesArtistico } from './styles-artistico';
import { stylesProduto } from './styles-produto';

export const allStyles = [
  ...styles,
  ...stylesCorporativo,
  ...stylesSocial,
  ...stylesArtistico,
  ...stylesProduto,
];
