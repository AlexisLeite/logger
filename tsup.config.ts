import type { Options } from 'tsup';

const env = process.env.NODE_ENV;

console.log({ env: env === 'production' });

const config: Options = {
  bundle: env === 'production',
  clean: true,
  dts: true,
  entry: ['src/**/*.ts'],
  format: ['esm', 'cjs'],
  minify: env === 'production',
  outDir: env === 'production' ? 'lib' : 'dist',
  skipNodeModulesBundle: true,
  sourcemap: env !== 'production',
  splitting: true,
  target: 'es2020',
  treeshake: true,
  tsconfig: './tsconfig.json',
  watch: true
};

export default config;
