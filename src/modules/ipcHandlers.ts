import { IpcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import {
  getStreamWindow,
  getStreamWindowConfig,
  createStreamWindow,
  safeCloseStreamWindow,
} from './streamWindow';
import {
  createWhiteboardWindow,
  safeClosewhiteboardWindow,
  getWhiteboardWindow,
} from './whiteboard-window';
import { getMainWindow } from './windowManager';
import { ENV, DEFAULT_URL } from './config';
import { screenSharingManager } from './screenSharing';
import { rollingMergeManager } from './rollingMergeManager';

// Global variables for FFmpeg processing
let ffmpegProcesses = new Map<string, any>(); // Map to store FFmpeg processes by meetingId

// IPC Handlers
function setupIpcHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('get-environment', () => {
    return ENV;
  });

  ipcMain.handle('get-default-url', () => {
    return DEFAULT_URL;
  });

  ipcMain.handle('get-window-status', async () => {
    return {
      mainWindow: !!getMainWindow(),
    };
  });

  // Centralized IPC Communication handler for allen-ui-live web app
  ipcMain.handle('sendMessage', async (event, message) => {
    try {
      switch (message.type) {
        case 'CONFIG_UPDATE':
          const streamWindow = getStreamWindow();
          if (streamWindow && !streamWindow.isDestroyed()) {
            streamWindow.close();
          }

          const agoraConfig = {
            appId: message.payload.appId,
            channel: message.payload.channel,
            token: message.payload.token,
            uid: parseInt(message.payload.uid),
            meetingId: message.payload.meetingId,
            deviceIds: message.payload.deviceIds,
            hosts: message.payload.hosts,
            url: message.payload.url,
            configuration: message.payload.configuration,
          };

          createStreamWindow(agoraConfig);
          return { type: 'SUCCESS', payload: 'Stream window created' };

        case 'AUDIO_TOGGLE':
          const streamWindowForAudio = getStreamWindow();
          if (streamWindowForAudio && !streamWindowForAudio.isDestroyed()) {
            const action = message.payload.enabled
              ? 'unmute-audio'
              : 'mute-audio';
            streamWindowForAudio.webContents.send(
              'stream-control',
              action,
              message.payload.enabled
            );
          }
          return { type: 'SUCCESS', payload: 'Audio toggle sent' };

        case 'VIDEO_TOGGLE':
          const streamWindowForVideo = getStreamWindow();
          if (streamWindowForVideo && !streamWindowForVideo.isDestroyed()) {
            const action = message.payload.enabled
              ? 'unmute-video'
              : 'mute-video';
            streamWindowForVideo.webContents.send('stream-control', action);
          }
          return { type: 'SUCCESS', payload: 'Video toggle sent' };

        case 'LEAVE_MEETING':
          console.log('LEAVE_MEETING', message.payload);
          safeCloseStreamWindow('LEAVE_MEETING');
          safeClosewhiteboardWindow('LEAVE_MEETING');

          // Stop FFmpeg process for this meeting
          const meetingId = message.payload?.meetingId;
          if (meetingId) {
            const ffmpegProcess = ffmpegProcesses.get(meetingId);
            if (ffmpegProcess && !ffmpegProcess.killed) {
              ffmpegProcess.stdin.end();
              ffmpegProcess.kill('SIGTERM');
              ffmpegProcesses.delete(meetingId);
              console.log(
                `FFmpeg process stopped for meeting ${meetingId} on leave`
              );
            }

            // Stop rolling merge process and cleanup
            rollingMergeManager.cleanupMeeting(meetingId);
          }

          return {
            type: 'SUCCESS',
            payload: 'Stream window closed and processes stopped',
          };

        case 'SCREEN_SHARING_TOGGLE':
          const streamWindowForScreenSharingToggle = getStreamWindow();
          if (
            streamWindowForScreenSharingToggle &&
            !streamWindowForScreenSharingToggle.isDestroyed()
          ) {
            // Focus the stream window when screen sharing is toggled
            streamWindowForScreenSharingToggle.focus();
            streamWindowForScreenSharingToggle.show();

            if (message.payload.enabled) {
              // Start screen sharing - show desktop capturer dialog
              try {
                console.log('About to show desktop capturer dialog');

                if (
                  !screenSharingManager ||
                  typeof screenSharingManager.showDesktopCapturer !== 'function'
                ) {
                  console.error(
                    'screenSharingManager is not properly initialized'
                  );
                  return {
                    type: 'ERROR',
                    error: 'Screen sharing manager not initialized',
                  };
                }

                // Show the desktop capturer dialog
                await screenSharingManager.showDesktopCapturer();
                console.log('Desktop capturer dialog shown');
              } catch (error) {
                console.error('Error showing desktop capturer:', error);
                return {
                  type: 'ERROR',
                  error: 'Failed to show desktop capturer',
                };
              }
            } else {
              // Stop screen sharing
              try {
                await screenSharingManager.stopScreenSharing();
                const action = 'mute-screen-sharing';
                streamWindowForScreenSharingToggle.webContents.send(
                  'stream-control',
                  action,
                  message.payload.enabled
                );
              } catch (error) {
                console.error('Error stopping screen sharing:', error);
                return {
                  type: 'ERROR',
                  error: 'Failed to stop screen sharing',
                };
              }
            }
          }
          return { type: 'SUCCESS', payload: 'Screen sharing toggle sent' };
        case 'OPEN_WHITEBOARD':
          createWhiteboardWindow(message.payload);
          return { type: 'SUCCESS', payload: 'Whiteboard window created' };
        case 'CLOSE_WHITEBOARD':
          safeClosewhiteboardWindow();
          return { type: 'SUCCESS', payload: 'Whiteboard window closed' };
        case 'MEDIA_CHUNK_DATA':
          try {
            const { meetingId, chunkData, chunkIndex, timestamp, isLastChunk } =
              message.payload;

            // Save chunk to file system as webm
            const recordingsDir = path.join(
              app.getPath('userData'),
              'recordings',
              meetingId
            );
            console.log('recordingsDir', recordingsDir);
            // Create recordings directory if it doesn't exist
            if (!fs.existsSync(recordingsDir)) {
              fs.mkdirSync(recordingsDir, { recursive: true });
            }

            // Store chunks as webm files
            const chunkFileName = `chunk_${chunkIndex.toString().padStart(6, '0')}.webm`;
            const chunkFilePath = path.join(recordingsDir, chunkFileName);

            // Write chunk data to file
            fs.writeFileSync(chunkFilePath, chunkData);

            // Add chunk to rolling merge manager
            rollingMergeManager.addChunk(meetingId, chunkFileName);

            // Get current chunk list
            const chunkList = rollingMergeManager.getChunkList(meetingId);

            // Perform rolling merge when we have multiple chunks
            if (chunkList.length > 1) {
              await rollingMergeManager.performRollingMerge(
                meetingId,
                recordingsDir,
                chunkList
              );
            }

            // Handle final merge when recording stops
            if (isLastChunk && chunkList.length > 0) {
              await rollingMergeManager.performFinalMerge(
                meetingId,
                recordingsDir,
                chunkList
              );
            }

            console.log(
              `Processed media chunk ${chunkIndex} - saved to ${chunkFilePath}`
            );
            return {
              type: 'SUCCESS',
              payload: {
                chunkFilePath,
                chunkIndex,
                merged: chunkList.length > 1,
                isLastChunk,
              },
            };
          } catch (error) {
            console.error('Error processing media chunk:', error);
            return {
              type: 'ERROR',
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        default:
          return { type: 'ERROR', error: 'Unknown message type' };
      }
    } catch (error) {
      console.error('Error handling message from allen-ui-live:', error);
      return {
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Request stream config handler
  ipcMain.handle('request-stream-config', async event => {
    try {
      const config = getStreamWindowConfig();
      if (config) {
        return config;
      } else {
        throw new Error('No stream config available');
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  });

  // Stream control handler
  ipcMain.handle('stream-control', async (event, action, enabled) => {
    try {
      const streamWindow = getStreamWindow();
      if (streamWindow && !streamWindow.isDestroyed()) {
        if (
          action === 'unmute-screen-sharing' ||
          action === 'mute-screen-sharing'
        ) {
          streamWindow.focus();
          streamWindow.show();
        }
        streamWindow.webContents.send('stream-control', action, enabled);
      }
      return {
        success: true,
        message: 'Stream control action sent to stream window',
      };
    } catch (error) {
      console.error('Failed to handle stream control:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get recordings directory path
  ipcMain.handle('get-recordings-path', async () => {
    try {
      const recordingsDir = path.join(app.getPath('userData'), 'recordings');
      return {
        success: true,
        recordingsPath: recordingsDir,
        userDataPath: app.getPath('userData'),
      };
    } catch (error) {
      console.error('Failed to get recordings path:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // List recordings for a specific meeting
  ipcMain.handle('list-recordings', async (event, meetingId) => {
    try {
      const recordingsDir = path.join(
        app.getPath('userData'),
        'recordings',
        meetingId
      );

      if (!fs.existsSync(recordingsDir)) {
        return {
          success: true,
          recordings: [],
          message: 'No recordings found for this meeting',
        };
      }

      const files = fs.readdirSync(recordingsDir);
      const recordings = files
        .filter(file => file.endsWith('.webm') || file.endsWith('.mpeg'))
        .map(file => {
          const filePath = path.join(recordingsDir, file);
          const stats = fs.statSync(filePath);
          return {
            fileName: file,
            filePath: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: file.endsWith('.webm') ? 'webm' : 'mpeg',
          };
        })
        .sort((a, b) => a.fileName.localeCompare(b.fileName));

      // Check for final recording files
      const finalRecordings = recordings.filter(recording =>
        recording.fileName.startsWith('final_recording_')
      );

      const intermediateRecordings = recordings.filter(
        recording => !recording.fileName.startsWith('final_recording_')
      );

      return {
        success: true,
        recordings: intermediateRecordings,
        finalRecordings: finalRecordings,
        meetingId: meetingId,
        totalFiles: intermediateRecordings.length,
        totalFinalRecordings: finalRecordings.length,
      };
    } catch (error) {
      console.error('Failed to list recordings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Open recordings folder in file explorer
  ipcMain.handle('open-recordings-folder', async (event, meetingId) => {
    try {
      const { shell } = require('electron');
      const recordingsDir = path.join(
        app.getPath('userData'),
        'recordings',
        meetingId
      );

      if (!fs.existsSync(recordingsDir)) {
        return {
          success: false,
          error: 'Recordings folder does not exist',
        };
      }

      await shell.openPath(recordingsDir);
      return {
        success: true,
        message: 'Recordings folder opened in file explorer',
      };
    } catch (error) {
      console.error('Failed to open recordings folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Cleanup function for FFmpeg processes
  const cleanupFFmpegProcesses = () => {
    console.log('Cleaning up FFmpeg processes...');
    ffmpegProcesses.forEach((process, meetingId) => {
      if (process && !process.killed) {
        try {
          process.stdin.end();
          process.kill('SIGTERM');
          console.log(`FFmpeg process killed for meeting ${meetingId}`);
        } catch (error) {
          console.error(
            `Error killing FFmpeg process for meeting ${meetingId}:`,
            error
          );
        }
      }
    });
    ffmpegProcesses.clear();

    // Cleanup rolling merge processes using the manager
    rollingMergeManager.cleanup();
  };

  // Register cleanup on app exit
  app.on('before-quit', cleanupFFmpegProcesses);
  app.on('window-all-closed', cleanupFFmpegProcesses);
}

export { setupIpcHandlers };
