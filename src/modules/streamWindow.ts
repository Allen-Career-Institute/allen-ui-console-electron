import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { StreamWindowConfig } from '@/types/electron';
import { getSharedSession } from './windowManager';
import { isDev } from './config';
import { registerStreamWindow } from './processNaming';

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

    // Get main window bounds for positioning
    const { getMainWindow } = require('./windowManager');
    const mainWindow = getMainWindow();

    // Calculate window dimensions and position for 16:9 aspect ratio
    const baseWidth = config.width || 320; // Base width for 16:9 ratio
    const windowWidth = baseWidth;
    const windowHeight = Math.round((baseWidth * 9) / 16); // 16:9 aspect ratio

    let x: number, y: number;

    if (mainWindow && !mainWindow.isDestroyed()) {
      // Position in bottom right of main window
      const mainBounds = mainWindow.getBounds();
      const margin = 20; // Margin from edges
      x = config.x || mainBounds.x + mainBounds.width - windowWidth - margin;
      y = config.y || mainBounds.y + mainBounds.height - windowHeight - margin;
    } else {
      // Fallback to screen bottom right if main window not available
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } =
        primaryDisplay.workAreaSize;
      const margin = 20; // Margin from edges
      x = config.x || screenWidth - windowWidth - margin;
      y = config.y || screenHeight - windowHeight - margin;
    }

    // Create the stream window
    streamWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      title: config.title || 'Live Stream',
      show: false,
      fullscreen: false, // Explicitly prevent fullscreen
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(
          app.isPackaged ? app.getAppPath() : process.cwd(),
          'dist',
          'stream-preload.js'
        ),
        webSecurity: false, // Disable for screen sharing to work
        allowRunningInsecureContent: true,
        // Enable experimental features for better screen sharing
        experimentalFeatures: true,
        // Enable WebRTC features
        enableBlinkFeatures:
          'WebCodecs,WebRTC,GetDisplayMedia,ScreenCaptureKit,DesktopCaptureKit,WebRTCPipeWireCapturer,MediaCapture,ScreenCapture',
        // Use shared session for localStorage/cookies persistence
        session: getSharedSession(),
      },
      resizable: true,
      minimizable: false,
      maximizable: true,
      closable: false,
      alwaysOnTop: true, // Keep on top of main window
      skipTaskbar: false,
      autoHideMenuBar: true,
      frame: true,
      transparent: false,
      hasShadow: true,
      thickFrame: false,
      titleBarStyle: 'default',
      movable: true,
      focusable: true,
      parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
      minWidth: 320,
      minHeight: 180,
      maxWidth: 480,
      maxHeight: 270,
    });

    // Load the stream window content
    streamWindow.loadURL(streamWindowConfig.url);

    // Inject JavaScript to prevent fullscreen requests from web content
    streamWindow.webContents.on('did-finish-load', () => {
      if (streamWindow) {
        // Register with new process naming system
        registerStreamWindow(streamWindow);
      }

      streamWindow?.webContents.executeJavaScript(`
        // Prevent fullscreen API usage
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen = function() {
            console.log('Fullscreen request blocked');
            return Promise.reject(new Error('Fullscreen not allowed'));
          };
        }
        if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen = function() {
            console.log('Webkit fullscreen request blocked');
            return Promise.reject(new Error('Fullscreen not allowed'));
          };
        }
        if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen = function() {
            console.log('Mozilla fullscreen request blocked');
            return Promise.reject(new Error('Fullscreen not allowed'));
          };
        }
        if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen = function() {
            console.log('MS fullscreen request blocked');
            return Promise.reject(new Error('Fullscreen not allowed'));
          };
        }
        
        // Prevent screen orientation changes
        if (screen && screen.orientation && screen.orientation.lock) {
          screen.orientation.lock = function() {
            console.log('Screen orientation lock blocked');
            return Promise.reject(new Error('Orientation lock not allowed'));
          };
        }
        
        console.log('Fullscreen prevention script injected');
      `);
    });

    // Initialize native screen capture immediately after window creation
    if (isDev()) {
      streamWindow.webContents.openDevTools();
    }

    // Handle window events
    streamWindow.once('ready-to-show', () => {
      if (streamWindow && !streamWindow.isDestroyed()) {
        streamWindow.show();
        // Ensure window is not fullscreen and has correct size
        streamWindow.setFullScreen(false);
        streamWindow.setSize(windowWidth, windowHeight);
        streamWindow.setPosition(x, y);
        // Don't set fullscreen or maximize - keep it as floating window
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
        streamWindowSettingUp = false;
        console.log('Stream window ready and shown as floating window');
      }
    });

    // Handle window movement to keep it on top
    streamWindow.on('move', () => {
      if (streamWindow && !streamWindow.isDestroyed()) {
        // Ensure it stays on top
        streamWindow.setAlwaysOnTop(true);
      }
    });

    // Handle main window resize to reposition stream window in bottom right
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.on('resize', () => {
        if (streamWindow && !streamWindow.isDestroyed()) {
          const mainBounds = mainWindow.getBounds();
          const [streamWidth, streamHeight] = streamWindow.getSize();
          const margin = 20;
          const newX = mainBounds.x + mainBounds.width - streamWidth - margin;
          const newY = mainBounds.y + mainBounds.height - streamHeight - margin;
          streamWindow.setPosition(newX, newY);
        }
      });
    }

    // Handle window resize to maintain 16:9 aspect ratio and keep it on top
    streamWindow.on('resize', () => {
      if (streamWindow && !streamWindow.isDestroyed()) {
        // Ensure it stays on top
        streamWindow.setAlwaysOnTop(true);

        // Maintain 16:9 aspect ratio
        const [width, height] = streamWindow.getSize();
        const targetAspectRatio = 16 / 9;
        const currentAspectRatio = width / height;

        if (Math.abs(currentAspectRatio - targetAspectRatio) > 0.1) {
          // If aspect ratio is significantly off, adjust height based on width
          const newHeight = Math.round(width / targetAspectRatio);
          streamWindow.setSize(width, newHeight);
        }
      }
    });

    // Prevent fullscreen attempts
    streamWindow.on('enter-full-screen', () => {
      if (streamWindow && !streamWindow.isDestroyed()) {
        streamWindow.setFullScreen(false);
        console.log('Fullscreen attempt blocked');
      }
    });

    // Prevent maximize attempts
    // streamWindow.on('maximize', () => {
    //   if (streamWindow && !streamWindow.isDestroyed()) {
    //     streamWindow.unmaximize();
    //     console.log('Maximize attempt blocked');
    //   }
    // });

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
