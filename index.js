import { Cartogram } from './src/cartogram';

export default {
  create(params) {
    const cartogram = new Cartogram(params);

    return cartogram;
  }
};
