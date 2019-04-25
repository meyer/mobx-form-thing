// @ts-check

/** @type {babel.ConfigFunction} */
module.exports = api => {
  api.cache.forever();
  return {
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          modules: false,
          loose: true,
          targets: [
            // evergreen browsers
            'last 2 chrome versions',
            'last 2 firefox versions',
            'last 2 safari versions',
          ],
        },
      ],
      // this probably isn't needed, since we don't use JSX in this lib
      require.resolve('@babel/preset-react'),
    ],
    plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
  };
};
