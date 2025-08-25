import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  dialog,
  crashReporter,
} from 'electron';
import * as Sentry from '@sentry/electron/main';
import { loadEnv, getLoadEnvError } from './modules/loadEnv';
import { getSentryDsn, getSentryEndpoint } from './modules/config';

loadEnv();

if (getSentryEndpoint()) {
  crashReporter.start({
    companyName: 'Allen Career Institute',
    productName: 'Astra',
    submitURL: getSentryEndpoint(),
    uploadToServer: true,
  });
}

if (getSentryDsn()) {
  Sentry.init({
    dsn: getSentryDsn(),
    environment: process.env.ENV,
    sendDefaultPii: true,
    tracesSampleRate: 0.1,
    getSessions: () => [
      session.defaultSession,
      session.fromPartition('persist:shared'),
    ],
    transportOptions: {
      maxAgeDays: 30,
      maxQueueSize: 30,
      flushAtStartup: true,
    },
    // Add process identification to Sentry
    beforeSend: event => {
      event.tags = {
        ...event.tags,
        process_type: 'main',
        process_name: 'Main Process',
        app_component: 'Astra Console',
      };
      return event;
    },
  });
}

// Import modules
import { createMenu } from './modules/menu';
import {
  setupIpcHandlers,
  cleanupFFmpegProcesses,
} from './modules/ipcHandlers';
import { setupAutoUpdater } from './modules/autoUpdater';
import { cleanup } from './modules/cleanup';
import { createMainWindow } from './modules/windowManager';
import { getStreamWindow } from './modules/streamWindow';
import { getWhiteboardWindow } from './modules/whiteboard-window';

// Enable hardware acceleration and WebRTC optimizations for better video quality
app.commandLine.appendSwitch(
  '--enable-features',
  'VaapiVideoDecoder,VaapiVideoEncoder,WebCodecs,WebRTCPipeWireCapturer'
);
app.commandLine.appendSwitch('--ignore-gpu-blacklist');
app.commandLine.appendSwitch('--enable-gpu-rasterization');
app.commandLine.appendSwitch('--enable-zero-copy');
app.commandLine.appendSwitch('--enable-accelerated-video-decode');
app.commandLine.appendSwitch('--enable-accelerated-video-encode');
app.commandLine.appendSwitch('--enable-webcodecs');
app.commandLine.appendSwitch('--enable-webrtc');

// Enable screen sharing permissions
app.commandLine.appendSwitch('--enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('--allow-running-insecure-content');
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--enable-experimental-web-platform-features');
app.commandLine.appendSwitch('--enable-features', 'GetDisplayMedia');
app.commandLine.appendSwitch('--enable-features', 'WebRTC');
app.commandLine.appendSwitch('--enable-features', 'WebCodecs');
app.commandLine.appendSwitch('--enable-features', 'WebRTCPipeWireCapturer');
app.commandLine.appendSwitch('--enable-features', 'ScreenCaptureKit');
app.commandLine.appendSwitch('--enable-features', 'DesktopCaptureKit');

// Additional WebRTC flags to resolve SDP codec collision issues
app.commandLine.appendSwitch(
  '--force-fieldtrials',
  'WebRTC-Audio-MinimizeResamplingOnMobile/Enabled/'
);
app.commandLine.appendSwitch(
  '--force-fieldtrials',
  'WebRTC-Video-QualityScaling/Enabled/'
);
app.commandLine.appendSwitch(
  '--force-fieldtrials',
  'WebRTC-Audio-OpusMaxAverageBitrate/Enabled/'
);
app.commandLine.appendSwitch('--webrtc-max-cpu-consumption-percentage', '100');
app.commandLine.appendSwitch('--webrtc-cpu-overuse-detection', 'false');

setupIpcHandlers(ipcMain);

// App event handlers
app.on('ready', () => {
  try {
    createMainWindow();
    createMenu();

    process.title = 'Astra-Main';
    // Set up automatic process naming for Electron processes
    // setupAutomaticProcessNaming();

    // Show error dialog if environment variables failed to load
    if (getLoadEnvError()) {
      dialog
        .showMessageBox({
          type: 'error',
          title: 'Environment Variables Error',
          message: 'Environment variables not loaded',
          detail: getLoadEnvError()?.message || 'Unknown error',
          buttons: ['OK'],
        })
        .catch(err => {
          console.error('Failed to show environment error dialog:', err);
        });
    }
    // logEnv();

    // Setup auto-updater with error handling
    try {
      setupAutoUpdater();
    } catch (autoUpdaterError) {
      console.error('Failed to setup auto-updater:', autoUpdaterError);
      // Continue with app initialization even if auto-updater fails
    }

    // Start cleanup worker from main window
    // startCleanupWorker();

    // Stream window will only open on CONFIG_UPDATE action, not automatically on startup
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  } else {
    console.log('window-all-closed');
    cleanupFFmpegProcesses();
    const streamWindow = getStreamWindow();
    if (streamWindow && !streamWindow.isDestroyed()) {
      streamWindow.close();
    }
    const whiteboardWindow = getWhiteboardWindow();
    if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
      whiteboardWindow.close();
    }
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  cleanupFFmpegProcesses();
  cleanup();
});
