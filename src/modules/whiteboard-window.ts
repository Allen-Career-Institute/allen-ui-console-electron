import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { DEFAULT_URL, ENV } from './config';
import { WhiteboardWindowConfig } from '@/types/electron';

let whiteboardWindow: BrowserWindow | null = null;
let whiteboardWindowConfig: WhiteboardWindowConfig | null = null;
let whiteboardWindowSettingUp: boolean = false;

// Force close whiteboard window (for admin/emergency use)
function forceClosewhiteboardWindow(): boolean {
  try {
    if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
      // Close the window
      whiteboardWindow.close();

      setTimeout(() => {
        if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
          try {
            whiteboardWindow.destroy();
          } catch (destroyError) {
            console.error('Error destroying whiteboard window:', destroyError);
          }
        }

        whiteboardWindow = null;
        whiteboardWindowSettingUp = false;
        whiteboardWindowConfig = null;
      }, 100);

      return true;
    }
    return false;
  } catch (error) {
    console.error('Error force closing whiteboard window:', error);
    return false;
  }
}

// Enhanced cleanup function
function cleanupwhiteboardWindowResources(): void {
  try {
    if (
      whiteboardWindow &&
      !whiteboardWindow.isDestroyed() &&
      whiteboardWindow.webContents
    ) {
      try {
        whiteboardWindow.webContents.send('cleanup-resources');
      } catch (error) {
        console.error(
          'Could not send cleanup signal to whiteboard window:',
          (error as Error).message
        );
      }
    }
  } catch (error) {
    console.error('Error during whiteboard window cleanup:', error);
  }
}

function safeClosewhiteboardWindow(reason: string = 'unknown'): boolean {
  try {
    if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
      cleanupwhiteboardWindowResources();

      if (
        whiteboardWindow.webContents &&
        whiteboardWindow.webContents.isLoading()
      ) {
        let loadTimeout = setTimeout(() => {
          proceedWithClose();
        }, 2000);

        whiteboardWindow.webContents.once('did-finish-load', () => {
          clearTimeout(loadTimeout);
          proceedWithClose();
        });

        whiteboardWindow.webContents.once('did-fail-load', () => {
          clearTimeout(loadTimeout);
          proceedWithClose();
        });

        return true;
      } else {
        return proceedWithClose();
      }

      function proceedWithClose(): boolean {
        try {
          whiteboardWindow?.close();

          setTimeout(() => {
            if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
              try {
                whiteboardWindow.destroy();
              } catch (destroyError) {
                console.error(
                  'Error destroying whiteboard window:',
                  destroyError
                );
              }
            }

            whiteboardWindow = null;
            whiteboardWindowSettingUp = false;
            whiteboardWindowConfig = null;
          }, 100);
          return true;
        } catch (error) {
          console.error('Error during whiteboard window close:', error);
          return false;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error in safeClosewhiteboardWindow:', error);
    return false;
  }
}

function createWhiteboardWindow(config: WhiteboardWindowConfig): BrowserWindow {
  try {
    if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
      return whiteboardWindow;
    }

    whiteboardWindowSettingUp = true;
    whiteboardWindowConfig = { ...config };

    // Get primary display bounds
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } =
      primaryDisplay.workAreaSize;

    // Calculate window dimensions and position
    const windowWidth = 1280;
    const windowHeight = 720;

    let x = Math.floor((screenWidth - windowWidth) / 2);
    let y = Math.floor((screenHeight - windowHeight) / 2);

    // if (config?.features) {
    //     x = parseInt(config?.features?.left || 0) || 0;
    //     y = parseInt(config?.features?.top || 0) || 0;

    //     // If "right" is given, override left (x)
    //     if (config?.features?.right !== undefined) {
    //       x = screenWidth - 1280 - parseInt(config?.features?.right || 0);
    //     }else {
    //       x = Math.floor((screenWidth - windowWidth) / 2);
    //     }

    //     // If "bottom" is given, override top (y)
    //     if (config?.features?.bottom !== undefined) {
    //       y = sh - height - parseInt(config?.features?.bottom);
    //     }
    // }

    // Create the whiteboard window
    whiteboardWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      title: 'Allen Whiteboard',
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../whiteboard-preload.js'),
        webSecurity: false, // Disable for screen sharing to work
        allowRunningInsecureContent: true,
        // Enable experimental features for better screen sharing
        experimentalFeatures: true,
        // Enable WebRTC features
        enableBlinkFeatures:
          'WebCodecs,WebRTC,GetDisplayMedia,ScreenCaptureKit,DesktopCaptureKit,WebRTCPipeWireCapturer',
      },
      resizable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      alwaysOnTop: false,
      skipTaskbar: false,
      autoHideMenuBar: true,
      frame: true,
      transparent: false,
      hasShadow: true,
      thickFrame: true,
      titleBarStyle: 'default',
    });

    // Load the whiteboard window content
    // whiteboardWindow.loadFile(path.join(__dirname, '../renderer/recording-window.html'));
    whiteboardWindow.loadURL(whiteboardWindowConfig.url || DEFAULT_URL);

    if (ENV === 'development') {
      whiteboardWindow.webContents.openDevTools();
    }
    // Handle window events
    whiteboardWindow.once('ready-to-show', () => {
      if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
        whiteboardWindow.show();
        whiteboardWindow.focus();
        whiteboardWindow.maximize;
        whiteboardWindowSettingUp = false;
      }
    });

    whiteboardWindow.on('closed', () => {
      whiteboardWindow = null;
      whiteboardWindowSettingUp = false;
      whiteboardWindowConfig = null;
    });

    whiteboardWindow.on('unresponsive', () => {
      console.error('Whiteboard window became unresponsive');
      whiteboardWindowSettingUp = false;
    });

    return whiteboardWindow;
  } catch (error) {
    console.error('Error creating whiteboard window:', error);
    whiteboardWindowSettingUp = false;
    throw error;
  }
}

// Getter functions
function getWhiteboardWindow(): BrowserWindow | null {
  return whiteboardWindow;
}

function getWhiteboardWindowConfig(): WhiteboardWindowConfig | null {
  return whiteboardWindowConfig;
}

// Export all functions
export {
  forceClosewhiteboardWindow,
  cleanupwhiteboardWindowResources,
  safeClosewhiteboardWindow,
  createWhiteboardWindow,
  getWhiteboardWindow,
  getWhiteboardWindowConfig,
};
