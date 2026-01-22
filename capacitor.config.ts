import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.example.timestamp',
    appName: 'Timestamp',
    webDir: 'dist',
    android: {
        allowMixedContent: true,
    },
    server: {
        androidScheme: 'https',
    },
};

export default config;
