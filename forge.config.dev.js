module.exports = {
  packagerConfig: {
    icon: './assets/icon',
    asar: true,
    // Only include essential assets
    extraResource: ['./assets/icon.ico', './assets/icon.png'],
    // Better ignore patterns to reduce size
    ignore: [
      /^\/(?!src|assets\/icon\.(ico|png)|package\.json)/,
      // Exclude heavy node_modules
      /node_modules\/(?!agora-rtc-sdk-ng|@electron|electron-store|electron-updater)/,
      // Exclude development files
      /\.git/,
      /\.github/,
      /\.vscode/,
      /\.idea/,
      /\.DS_Store/,
      /\.env/,
      /\.log/,
      /\.md$/,
      /\.ts$/,
      /\.map$/,
      /test/,
      /tests/,
      /__tests__/,
      /coverage/,
      /\.nyc_output/,
      /docs/,
      /examples/,
      /scripts\/(?!setup|generate-dev-cert)/,
    ],
    // Enable compression
    compression: 'maximum',
    // Prune dependencies
    prune: true,
    // Overwrite existing files
    overwrite: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'allen_ui_console_dev',
        authors: 'Allen Digital',
        description: 'Allen UI Console Electron App (Development)',
        // Use local development certificate if available
        certificateFile: process.env.LOCAL_CERTIFICATE_PATH || null,
        certificatePassword: process.env.LOCAL_CERTIFICATE_PASSWORD || null,
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-updater',
      config: {
        repository: {
          owner: 'dinesh-kumar-allen',
          name: 'allen-ui-console-electron',
        },
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'dinesh-kumar-allen',
          name: 'allen-ui-console-electron',
        },
        prerelease: true, // Mark as pre-release for development builds
        draft: true, // Create as draft for development builds
      },
    },
  ],
};
