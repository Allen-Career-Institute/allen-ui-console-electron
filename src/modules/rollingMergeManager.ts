import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface RollingMergeConfig {
  meetingId: string;
  recordingsDir: string;
  chunkList: string[];
}

export interface RollingMergeProcess {
  process: ChildProcess;
  meetingId: string;
  startTime: number;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  outputPath?: string;
  error?: string;
}

export interface MergeResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  chunksProcessed: number;
}

export class RollingMergeManager {
  private rollingMergeProcesses: Map<string, RollingMergeProcess> = new Map();
  private chunkLists: Map<string, string[]> = new Map();

  /**
   * Perform rolling merge of webm chunks
   */
  async performRollingMerge(
    meetingId: string,
    recordingsDir: string,
    chunkList: string[]
  ): Promise<MergeResult> {
    try {
      // Stop existing rolling merge process if running
      await this.stopRollingMerge(meetingId);

      // Create concat file for FFmpeg
      const concatFilePath = path.join(recordingsDir, 'concat_list.txt');
      const concatContent = chunkList
        .map(chunk => `file '${chunk}'`)
        .join('\n');
      fs.writeFileSync(concatFilePath, concatContent);

      // Output file for merged video
      const outputFilePath = path.join(recordingsDir, 'merged_output.webm');

      // Build FFmpeg command for concat demuxer
      const ffmpegArgs = [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatFilePath,
        '-c',
        'copy', // Copy streams without re-encoding for speed
        outputFilePath,
      ];

      console.log(
        `Starting rolling merge for meeting ${meetingId} with ${chunkList.length} chunks`
      );
      console.log(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);

      // Spawn FFmpeg process
      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
        cwd: recordingsDir,
      });

      // Create process record
      const processRecord: RollingMergeProcess = {
        process: ffmpegProcess,
        meetingId,
        startTime: Date.now(),
        status: 'running',
      };

      // Store the process
      this.rollingMergeProcesses.set(meetingId, processRecord);

      // Handle process events
      ffmpegProcess.stderr.on('data', (data: Buffer) => {
        console.log(`Rolling merge stderr: ${data.toString()}`);
      });

      return new Promise<MergeResult>(resolve => {
        ffmpegProcess.on('close', (code: number) => {
          console.log(
            `Rolling merge process exited with code ${code} for meeting ${meetingId}`
          );

          if (code === 0) {
            console.log(
              `Successfully merged ${chunkList.length} chunks into ${outputFilePath}`
            );

            // Clean up individual chunk files after successful merge
            chunkList.forEach(chunkFileName => {
              const chunkPath = path.join(recordingsDir, chunkFileName);
              if (fs.existsSync(chunkPath)) {
                fs.unlinkSync(chunkPath);
                console.log(`Cleaned up chunk file: ${chunkFileName}`);
              }
            });

            // Update chunk list to only contain the merged file
            this.chunkLists.set(meetingId, ['merged_output.webm']);

            processRecord.status = 'completed';
            processRecord.outputPath = outputFilePath;
            this.rollingMergeProcesses.delete(meetingId);

            resolve({
              success: true,
              outputPath: outputFilePath,
              chunksProcessed: chunkList.length,
            });
          } else {
            console.error(
              `Rolling merge failed with code ${code} for meeting ${meetingId}`
            );
            processRecord.status = 'failed';
            processRecord.error = `Process exited with code ${code}`;
            this.rollingMergeProcesses.delete(meetingId);

            resolve({
              success: false,
              error: `Process exited with code ${code}`,
              chunksProcessed: chunkList.length,
            });
          }
        });

        ffmpegProcess.on('error', (err: Error) => {
          console.error('Rolling merge process error:', err);
          processRecord.status = 'failed';
          processRecord.error = err.message;
          this.rollingMergeProcesses.delete(meetingId);

          resolve({
            success: false,
            error: err.message,
            chunksProcessed: chunkList.length,
          });
        });
      });
    } catch (error) {
      console.error('Error in rolling merge:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        chunksProcessed: chunkList.length,
      };
    }
  }

  /**
   * Perform final merge when recording stops
   */
  async performFinalMerge(
    meetingId: string,
    recordingsDir: string,
    chunkList: string[]
  ): Promise<MergeResult> {
    try {
      console.log(
        `Performing final merge for meeting ${meetingId} with ${chunkList.length} chunks`
      );

      // Wait for any ongoing rolling merge to complete
      const rollingProcess = this.rollingMergeProcesses.get(meetingId);
      if (rollingProcess && rollingProcess.status === 'running') {
        console.log('Waiting for ongoing rolling merge to complete...');
        await new Promise<void>(resolve => {
          const checkStatus = () => {
            const currentProcess = this.rollingMergeProcesses.get(meetingId);
            if (!currentProcess || currentProcess.status !== 'running') {
              resolve();
            } else {
              setTimeout(checkStatus, 100);
            }
          };
          checkStatus();
        });
      }

      // If we have multiple files to merge
      if (chunkList.length > 1) {
        // Create concat file for FFmpeg
        const concatFilePath = path.join(
          recordingsDir,
          'final_concat_list.txt'
        );
        const concatContent = chunkList
          .map(chunk => `file '${chunk}'`)
          .join('\n');
        fs.writeFileSync(concatFilePath, concatContent);

        // Final output file
        const finalOutputPath = path.join(
          recordingsDir,
          `final_recording_${meetingId}.webm`
        );

        // Build FFmpeg command for final merge
        const ffmpegArgs = [
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          concatFilePath,
          '-c',
          'copy', // Copy streams without re-encoding
          finalOutputPath,
        ];

        console.log(`Starting final merge for meeting ${meetingId}`);
        console.log(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);

        return new Promise<MergeResult>(resolve => {
          // Spawn FFmpeg process for final merge
          const finalProcess = spawn('ffmpeg', ffmpegArgs, {
            cwd: recordingsDir,
          });

          // Handle process events
          finalProcess.stderr.on('data', (data: Buffer) => {
            console.log(`Final merge stderr: ${data.toString()}`);
          });

          finalProcess.on('close', (code: number) => {
            console.log(
              `Final merge process exited with code ${code} for meeting ${meetingId}`
            );

            if (code === 0) {
              console.log(
                `Successfully created final recording: ${finalOutputPath}`
              );

              // Clean up intermediate files
              chunkList.forEach(chunkFileName => {
                const chunkPath = path.join(recordingsDir, chunkFileName);
                if (fs.existsSync(chunkPath)) {
                  fs.unlinkSync(chunkPath);
                  console.log(`Cleaned up intermediate file: ${chunkFileName}`);
                }
              });

              // Clean up concat files
              const concatFiles = ['concat_list.txt', 'final_concat_list.txt'];
              concatFiles.forEach(concatFile => {
                const concatPath = path.join(recordingsDir, concatFile);
                if (fs.existsSync(concatPath)) {
                  fs.unlinkSync(concatPath);
                  console.log(`Cleaned up concat file: ${concatFile}`);
                }
              });

              // Clean up merged_output.webm if it exists
              const mergedOutputPath = path.join(
                recordingsDir,
                'merged_output.webm'
              );
              if (fs.existsSync(mergedOutputPath)) {
                fs.unlinkSync(mergedOutputPath);
                console.log('Cleaned up merged_output.webm');
              }

              // Clear chunk list
              this.chunkLists.delete(meetingId);

              resolve({
                success: true,
                outputPath: finalOutputPath,
                chunksProcessed: chunkList.length,
              });
            } else {
              console.error(
                `Final merge failed with code ${code} for meeting ${meetingId}`
              );
              resolve({
                success: false,
                error: `Process exited with code ${code}`,
                chunksProcessed: chunkList.length,
              });
            }
          });

          finalProcess.on('error', (err: Error) => {
            console.error('Final merge process error:', err);
            resolve({
              success: false,
              error: err.message,
              chunksProcessed: chunkList.length,
            });
          });
        });
      } else if (chunkList.length === 1) {
        // If only one chunk, rename it to final recording
        const singleChunkPath = path.join(recordingsDir, chunkList[0]);
        const finalOutputPath = path.join(
          recordingsDir,
          `final_recording_${meetingId}.webm`
        );

        if (fs.existsSync(singleChunkPath)) {
          fs.renameSync(singleChunkPath, finalOutputPath);
          console.log(
            `Renamed single chunk to final recording: ${finalOutputPath}`
          );
        }

        // Clear chunk list
        this.chunkLists.delete(meetingId);

        return {
          success: true,
          outputPath: finalOutputPath,
          chunksProcessed: 1,
        };
      }

      return {
        success: false,
        error: 'No chunks to merge',
        chunksProcessed: 0,
      };
    } catch (error) {
      console.error('Error in final merge:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        chunksProcessed: chunkList.length,
      };
    }
  }

  /**
   * Stop rolling merge process for a specific meeting
   */
  async stopRollingMerge(meetingId: string): Promise<void> {
    const processRecord = this.rollingMergeProcesses.get(meetingId);
    if (processRecord && processRecord.status === 'running') {
      try {
        processRecord.process.kill('SIGTERM');
        processRecord.status = 'stopped';
        console.log(`Rolling merge process stopped for meeting ${meetingId}`);
      } catch (error) {
        console.error(
          `Error stopping rolling merge process for meeting ${meetingId}:`,
          error
        );
      }
      this.rollingMergeProcesses.delete(meetingId);
    }
  }

  /**
   * Add chunk to the list for a meeting
   */
  addChunk(meetingId: string, chunkFileName: string): void {
    if (!this.chunkLists.has(meetingId)) {
      this.chunkLists.set(meetingId, []);
    }

    const chunkList = this.chunkLists.get(meetingId)!;
    chunkList.push(chunkFileName);
  }

  /**
   * Get chunk list for a meeting
   */
  getChunkList(meetingId: string): string[] {
    return this.chunkLists.get(meetingId) || [];
  }

  /**
   * Check if rolling merge is running for a meeting
   */
  isRollingMergeRunning(meetingId: string): boolean {
    const processRecord = this.rollingMergeProcesses.get(meetingId);
    return processRecord?.status === 'running' || false;
  }

  /**
   * Get all active rolling merge processes
   */
  getActiveProcesses(): Map<string, RollingMergeProcess> {
    return new Map(this.rollingMergeProcesses);
  }

  /**
   * Cleanup all rolling merge processes
   */
  cleanup(): void {
    console.log('Cleaning up rolling merge processes...');
    this.rollingMergeProcesses.forEach((processRecord, meetingId) => {
      if (processRecord.status === 'running') {
        try {
          processRecord.process.kill('SIGTERM');
          console.log(`Rolling merge process killed for meeting ${meetingId}`);
        } catch (error) {
          console.error(
            `Error killing rolling merge process for meeting ${meetingId}:`,
            error
          );
        }
      }
    });
    this.rollingMergeProcesses.clear();
    this.chunkLists.clear();
  }

  /**
   * Cleanup processes for a specific meeting
   */
  cleanupMeeting(meetingId: string): void {
    this.stopRollingMerge(meetingId);
    this.chunkLists.delete(meetingId);
  }
}

// Export singleton instance
export const rollingMergeManager = new RollingMergeManager();
