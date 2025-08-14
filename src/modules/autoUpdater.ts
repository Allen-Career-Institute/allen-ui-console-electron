import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';

function setupAutoUpdater(): void {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. The app will update automatically.',
    });
  });

  autoUpdater.on('update-downloaded', () => {
    const dialogOpts = {
      type: 'info' as const,
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: 'Update downloaded. The app will restart to install the update.',
      detail:
        'A new version has been downloaded. Restart the application to apply the updates.',
    };

    dialog.showMessageBox(dialogOpts).then(returnValue => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
  });
}

export { setupAutoUpdater };
