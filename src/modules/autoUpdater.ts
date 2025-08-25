import { dialog } from 'electron';
import { isDev } from './config';

// Try to import electron-updater with fallback
let autoUpdater: any = null;

try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (error) {
  console.error('Failed to load electron-updater:', error);
  // Try alternative import path
  try {
    const electronUpdater = require('electron-updater');
    autoUpdater = electronUpdater.autoUpdater || electronUpdater;
  } catch (fallbackError) {
    console.error(
      'Failed to load electron-updater with fallback:',
      fallbackError
    );
  }
}

function setupAutoUpdater(): void {
  try {
    // Check if autoUpdater is available
    if (!autoUpdater) {
      console.warn('electron-updater module not found, auto-updater disabled');
      return;
    }

    // Check if running in development mode
    if (isDev()) {
      console.log('Auto-updater disabled in development mode');
      return;
    }

    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Check for updates
    autoUpdater.checkForUpdatesAndNotify();
  } catch (error) {
    console.error('Failed to setup auto-updater:', error);
  }

  if (!autoUpdater) return;

  autoUpdater.on('update-available', () => {
    try {
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message:
          'A new version is available. The app will update automatically.',
      });
    } catch (error) {
      console.error('Error showing update available dialog:', error);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    try {
      const dialogOpts = {
        type: 'info' as const,
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message:
          'Update downloaded. The app will restart to install the update.',
        detail:
          'A new version has been downloaded. Restart the application to apply the updates.',
      };

      dialog.showMessageBox(dialogOpts).then(returnValue => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall();
      });
    } catch (error) {
      console.error('Error showing update downloaded dialog:', error);
    }
  });

  autoUpdater.on('error', (error: any) => {
    console.error('Auto-updater error:', error);
  });
}

export { setupAutoUpdater };
