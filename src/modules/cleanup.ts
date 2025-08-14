import { dialog } from 'electron';
import { getMainWindow } from './windowManager';
import { getStreamWindow } from './streamWindow';
import { getWhiteboardWindow } from './whiteboard-window';
import { ENV } from './config';

function cleanup(): void {
  const mainWindow = getMainWindow();
  const streamWindow = getStreamWindow();
  const whiteboardWindow = getWhiteboardWindow();

  if (streamWindow && !streamWindow.isDestroyed()) {
    streamWindow.close();
  }

  if (mainWindow) {
    mainWindow.close();
  }

  if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
    whiteboardWindow.close();
  }
}

function handleUncaughtException(error: Error): void {
  console.error('Uncaught Exception:', error);

  if (ENV === 'development') {
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

  if (ENV === 'development') {
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
