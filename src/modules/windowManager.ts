import { BrowserWindow, session, app } from 'electron';
import path from 'path';
import { getUrlByEnv, isDev, setCurrentUrl } from './config';
import { safeCloseStreamWindow } from './streamWindow';
import { safeClosewhiteboardWindow } from './whiteboard-window';
import { createMenu } from './menu';
import { registerMainUI } from './processNaming';

let mainWindow: BrowserWindow | null = null;
let mainWindowHasLoaded: boolean = false;
let sharedSession: Electron.Session | null = null;

// Lazy initialization of shared session
function getSharedSession(): Electron.Session {
  if (!sharedSession) {
    // Create a shared session for all windows to ensure localStorage/cookies persistence
    sharedSession = session.fromPartition('persist:shared');

    // Debug: Log session information
    console.log('Shared session created with partition: persist:shared');
    console.log('Shared session storage path:', sharedSession.getStoragePath());

    // Configure permission handler
    sharedSession.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        if (permission === 'media' || permission === 'display-capture') {
          callback(true); // Allow screen capture
        } else {
          callback(false);
        }
      }
    );
  }
  return sharedSession;
}

function injectTokensToWindow(window: BrowserWindow): void {
  if (isDev()) {
    const tokens = JSON.parse(process.env.AUTH_TOKEN || '{}');

    if (tokens && Object.keys(tokens).length > 0) {
      window.webContents.executeJavaScript(`
        (function() {
          try {
            const tokens = ${JSON.stringify(tokens)};
            localStorage.setItem('tokens', JSON.stringify(tokens));
          } catch (error) {
            console.error('Failed to inject tokens to localStorage:', error);
          }
        })();
      `);
    }
  }
}

function createMainWindow(): BrowserWindow {
  // Use app.getAppPath() for packaged app, process.cwd() for development
  const appPath = app.isPackaged ? app.getAppPath() : process.cwd();
  const preloadPath = path.join(appPath, 'dist', 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: process.platform === 'darwin' ? true : false,
    frame: true,
    maximizable: true,
    resizable: true,
    minimizable: true,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: false, // only if you trust the content
      sandbox: false,
      allowRunningInsecureContent: true, // only if HTTP content
      // Most important for WebRTC:
      webviewTag: false,
      experimentalFeatures: true,
      enableBlinkFeatures: 'MediaCapture,ScreenCapture',
      // Use shared session for localStorage/cookies persistence
      session: getSharedSession(),
    },
    title: 'Astra',
  });

  mainWindow.loadURL(getUrlByEnv());
  mainWindow.maximize();

  if (isDev()) {
    mainWindow.webContents.openDevTools();
  }

  // Ensure window is properly set after content loads
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindowHasLoaded = true;
    if (mainWindow) {
      // Register with new process naming system
      registerMainUI(mainWindow);
    }
    try {
      if (mainWindow) {
        mainWindow.maximize();
        if (process.platform === 'darwin') {
          mainWindow.setFullScreen(true);
        }
        injectTokensToWindow(mainWindow);
      }
    } catch (error) {
      console.error('Failed to inject tokens to main window:', error);
    }
  });

  mainWindow.webContents.on('did-start-loading', () => {
    mainWindowHasLoaded = false;
  });
  mainWindow.on('close', () => {
    safeCloseStreamWindow();
    safeClosewhiteboardWindow();
  });

  mainWindow.webContents.on('did-navigate', (event, url) => {
    setCurrentUrl(url);
    createMenu();
  });

  // Stream window is now floating and independent - no need to update its position
  // when main window moves or resizes

  return mainWindow;
}

function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

function isMainWindowLoaded(): boolean {
  return mainWindowHasLoaded;
}

function setMainWindowLoaded(loaded: boolean): void {
  mainWindowHasLoaded = loaded;
}

// Export the shared session getter so other windows can use it
export {
  createMainWindow,
  getMainWindow,
  isMainWindowLoaded,
  setMainWindowLoaded,
  injectTokensToWindow,
  getSharedSession,
};
