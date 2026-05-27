import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const theme = create({
  base: 'dark',

  // Brand
  brandTitle: 'Starkën Design System',
  brandUrl: 'https://starkentecnologia.com.br',
  brandImage: './logo-fenix-tecnologia.png',
  brandTarget: '_self',

  // UI
  appBg: '#020617',
  appContentBg: '#0f172a',
  appBorderColor: 'rgba(255, 255, 255, 0.1)',
  appBorderRadius: 8,

  // Typography
  fontBase: '"Poppins", sans-serif',
  fontCode: 'monospace',

  // Text colors
  textColor: '#ffffff',
  textInverseColor: '#020617',
  textMutedColor: '#94a3b8',

  // Toolbar default and active colors
  barTextColor: '#94a3b8',
  barSelectedColor: '#10b981',
  barBg: '#0f172a',

  // Form colors
  inputBg: '#020617',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputTextColor: '#ffffff',
  inputBorderRadius: 8,

  // Brand colors
  colorPrimary: '#10b981',
  colorSecondary: '#0d9488',
});

addons.setConfig({
  theme,
  sidebar: {
    showRoots: true,
    collapsedRoots: [],
  },
});
