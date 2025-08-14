import { BrowserWindow, dialog } from 'electron';
import path from 'path';
import { getMainWindow } from './windowManager';
import { getStreamWindow, safeCloseStreamWindow } from './streamWindow';

const reloadMainWindow = (force: boolean = false): void => {
  const mainWindow: BrowserWindow | null = getMainWindow();
  const streamWindow: BrowserWindow | null = getStreamWindow();

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (streamWindow && !streamWindow.isDestroyed()) {
      // Show confirmation dialog
      dialog
        .showMessageBox(mainWindow, {
          type: 'question',
          buttons: ['Cancel', 'Reload'],
          defaultId: 1,
          title: 'Confirm Reload',
          message: 'Are you sure you want to reload the main window?',
          detail: 'This will stop the stream window if it is currently open.',
        })
        .then(result => {
          if (result.response === 1) {
            // User clicked "Reload"
            // Close stream window before reloading main window
            safeCloseStreamWindow('main-window-reload');

            if (force) {
              mainWindow.webContents.reloadIgnoringCache();
            } else {
              mainWindow.reload();
            }
          }
        })
        .catch((error: Error) => {
          console.error('Error showing reload confirmation dialog:', error);
        });
    } else {
      if (force) {
        mainWindow.webContents.reloadIgnoringCache();
      } else {
        mainWindow.reload();
      }
    }
  } else {
    console.log('Main window is destroyed');
  }
};

export { reloadMainWindow };
