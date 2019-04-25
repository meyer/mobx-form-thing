// @ts-check

import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

/**
 * @typedef {import('rollup').InputOptions} InputOptions
 * @typedef {import('rollup').OutputOptions} OutputOptions
 * @type {InputOptions & { output: OutputOptions[] }}
 */
export default {
  input: 'src/index.ts',
  plugins: [
    commonjs(),
    resolve({
      jail: '/src',
    }),
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: 'esnext',
        },
      },
    }),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    }),
  ],
  output: [
    {
      file: `lib/index.esm.js`,
      format: 'esm',
      sourcemap: true,
    },
    {
      file: `lib/index.cjs.js`,
      format: 'cjs',
      sourcemap: true,
    },
  ],
  watch: {
    exclude: ['node_modules/**'],
  },
  external: ['prop-types', 'react', 'react-dom', 'mobx', 'mobx-react-lite', 'yup', 'shallow-compare'],
};
