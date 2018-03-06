import babel from 'rollup-plugin-babel';
import builtins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'index.js',
  output: {
    sourcemap: true,
    file: 'dist/main.js',
    name: 'Cartogram',
    format: 'umd'
  },
  plugins: [
    json(),
    babel({
      exclude: 'node_modules/**'
    }),
    resolve({
      jsnext: true
    }),
    commonjs(),
    globals(),
    builtins(),
    sourcemaps(),
    uglify()
  ]
};
