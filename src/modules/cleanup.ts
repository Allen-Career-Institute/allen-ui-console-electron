import { dialog } from 'electron';
import { getMainWindow } from './windowManager';
import { safeCloseStreamWindow } from './streamWindow';
import { safeClosewhiteboardWindow } from './whiteboard-window';
import { isDev } from './config';

function cleanup(): void {
  const mainWindow = getMainWindow();

  safeCloseStreamWindow();
  safeClosewhiteboardWindow();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
}

function handleUncaughtException(error: Error): void {
  console.error('Uncaught Exception:', error);

  if (isDev()) {
    dialog.showErrorBox(
      'Uncaught Exception',
      `An uncaught exception occurred: ${error.message}\n\nStack: ${error.stack}`
    );
  }
}

function handleUnhandledRejection(
  reason: unknown,
  promise: Promise<unknown>
): void {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);

  if (isDev()) {
    dialog.showErrorBox(
      'Unhandled Rejection',
      `An unhandled rejection occurred: ${reason}`
    );
  }
}

function setupCleanupHandlers(): void {
  process.on('uncaughtException', handleUncaughtException);
  process.on('unhandledRejection', handleUnhandledRejection);
}

export {
  cleanup,
  handleUncaughtException,
  handleUnhandledRejection,
  setupCleanupHandlers,
};
