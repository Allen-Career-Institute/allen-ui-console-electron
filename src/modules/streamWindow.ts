import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { DEFAULT_URL, ENV } from './config';
import { StreamWindowConfig } from '@/types/electron';

let streamWindow: BrowserWindow | null = null;
let streamWindowConfig: StreamWindowConfig | null = null;
let streamWindowSettingUp: boolean = false;

// Enhanced cleanup function
function cleanupStreamWindowResources(): void {
  try {
    if (
      streamWindow &&
      !streamWindow.isDestroyed() &&
      streamWindow.webContents
    ) {
      try {
        streamWindow.webContents.send('cleanup-resources');
      } catch (error) {
        console.log(
          'Could not send cleanup signal to stream window:',
          (error as Error).message
        );
      }
    }
  } catch (error) {
    console.error('Error during stream window cleanup:', error);
  }
}

function safeCloseStreamWindow(reason: string = 'unknown'): boolean {
  try {
    if (streamWindow && !streamWindow.isDestroyed()) {
      cleanupStreamWindowResources();

      if (streamWindow.webContents && streamWindow.webContents.isLoading()) {
        let loadTimeout = setTimeout(() => {
          proceedWithClose();
        }, 2000);

        streamWindow.webContents.once('did-finish-load', () => {
          clearTimeout(loadTimeout);
          proceedWithClose();
        });

        streamWindow.webContents.once('did-fail-load', () => {
          clearTimeout(loadTimeout);
          proceedWithClose();
        });

        return true;
      } else {
        return proceedWithClose();
      }

      function proceedWithClose(): boolean {
        try {
          streamWindow?.close();

          setTimeout(() => {
            if (streamWindow && !streamWindow.isDestroyed()) {
              try {
                streamWindow.destroy();
              } catch (destroyError) {
                console.error('Error destroying stream window:', destroyError);
              }
            }

            streamWindow = null;
            streamWindowSettingUp = false;
            streamWindowConfig = null;
          }, 100);
          return true;
        } catch (error) {
          console.error('Error during stream window close:', error);
          return false;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error in safeCloseStreamWindow:', error);
    return false;
  }
}

function createStreamWindow(config: StreamWindowConfig): BrowserWindow {
  try {
    if (streamWindow && !streamWindow.isDestroyed()) {
      console.log('Stream window already exists, returning existing window');
      return streamWindow;
    }

    streamWindowSettingUp = true;
    streamWindowConfig = { ...config };

    // Get primary display bounds
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } =
      primaryDisplay.workAreaSize;

    // Calculate window dimensions and position
    const windowWidth = config.width || 1280;
    const windowHeight = config.height || 720;
    const x = config.x || Math.floor((screenWidth - windowWidth) / 2);
    const y = config.y || Math.floor((screenHeight - windowHeight) / 2);

    // Create the stream window
    streamWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      title: config.title || 'Allen Live Stream',
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, '../stream-preload.js'),
        webSecurity: false, // Disable for screen sharing to work
        allowRunningInsecureContent: true,
        // Enable experimental features for better screen sharing
        experimentalFeatures: true,
        // Enable WebRTC features
        enableBlinkFeatures:
          'WebCodecs,WebRTC,GetDisplayMedia,ScreenCaptureKit,DesktopCaptureKit,WebRTCPipeWireCapturer,MediaCapture,ScreenCapture',
      },
      resizable: true,
      minimizable: true,
      maximizable: true,
      closable: false,
      alwaysOnTop: false,
      skipTaskbar: false,
      autoHideMenuBar: true,
      frame: true,
      transparent: false,
      hasShadow: true,
      thickFrame: true,
      titleBarStyle: 'default',
    });

    // Load the stream window content
    streamWindow.loadURL(streamWindowConfig.url || DEFAULT_URL);

    // Initialize native screen capture immediately after window creation
    const { getMainWindow } = require('./windowManager');
    if (ENV === 'development') {
      streamWindow.webContents.openDevTools();
    }
    // Handle window events
    streamWindow.once('ready-to-show', () => {
      if (streamWindow && !streamWindow.isDestroyed()) {
        streamWindow.show();
        streamWindow.setFullScreen(true);
        streamWindow.maximize();
        getMainWindow()?.show();
        // getMainWindow()?.focus();
        streamWindowSettingUp = false;
        console.log('Stream window ready and shown');
      }
    });

    streamWindow.on('closed', () => {
      streamWindow = null;
      streamWindowSettingUp = false;
      streamWindowConfig = null;
      console.log('Stream window closed');
    });

    streamWindow.on('unresponsive', () => {
      console.error('Stream window became unresponsive');
      streamWindowSettingUp = false;
    });

    return streamWindow;
  } catch (error) {
    console.error('Error creating stream window:', error);
    streamWindowSettingUp = false;
    throw error;
  }
}

// Getter functions
function getStreamWindow(): BrowserWindow | null {
  return streamWindow;
}

function getStreamWindowConfig(): StreamWindowConfig | null {
  return streamWindowConfig;
}

function isStreamWindowSettingUp(): boolean {
  return streamWindowSettingUp;
}

// Export all functions
export {
  cleanupStreamWindowResources,
  safeCloseStreamWindow,
  createStreamWindow,
  getStreamWindow,
  getStreamWindowConfig,
  isStreamWindowSettingUp,
};
