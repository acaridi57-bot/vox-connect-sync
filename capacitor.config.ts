import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.speaklivetranslate',
  appName: 'VoxTranslate',
  webDir: 'dist',
  server: {
    url: 'https://cd1d082a-fee6-4dbf-b753-ff1f6d59723d.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
