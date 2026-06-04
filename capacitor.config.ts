import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sn.senbus.app',
  appName: 'SunuBus',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
