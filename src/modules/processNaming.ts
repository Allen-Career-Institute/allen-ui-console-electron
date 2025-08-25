import { BrowserWindow } from 'electron';
import { ChildProcess } from 'child_process';
import { getEnv } from './config';

// Process naming configuration
export interface ProcessConfig {
  name: string;
  description: string;
  type: 'main' | 'renderer' | 'worker' | 'utility' | 'gpu' | 'helper';
  category:
    | 'ui'
    | 'streaming'
    | 'whiteboard'
    | 'background'
    | 'monitoring'
    | 'system';
  processName: string; // Unique process name for OS task manager
}

// Centralized process naming registry
class ProcessNamingRegistry {
  private processNames = new Map<number, ProcessConfig>();
  private appName = 'Astra';
  private environment = getEnv() || 'development';

  constructor() {
    // Register main process
    this.registerMainProcess();

    // Set up process monitoring to catch all Electron processes
    this.setupProcessMonitoring();
  }

  private setupProcessMonitoring(): void {
    // Monitor for new processes and automatically name them
    if (typeof process !== 'undefined' && process.on) {
      // This will help catch GPU and other Electron processes
      process.on('exit', () => {
        console.log('Main process exiting, cleaning up process names');
      });
    }
  }

  private registerMainProcess(): void {
    const mainProcessConfig: ProcessConfig = {
      name: 'Main',
      description: 'Electron main process - application core',
      type: 'main',
      category: 'background',
      processName: 'Astra-Main',
    };

    this.processNames.set(process.pid, mainProcessConfig);

    // Set process title for better OS-level identification
    this.setProcessTitle(process.pid, mainProcessConfig.processName);
  }

  private setProcessTitle(pid: number, processName: string): void {
    try {
      if (process.platform === 'win32') {
        // Windows: Set process title
        process.title = processName;
      } else if (process.platform === 'darwin') {
        // macOS: Set process name
        process.title = processName;
        // Also try to set the process name using execArgv
        if (
          process.argv[0] &&
          (process.argv[0].includes('electron') ||
            process.argv[0].includes('Astra'))
        ) {
          process.argv[0] = processName;
        }
      } else {
        // Linux: Set process title
        process.title = processName;
      }
    } catch (error) {
      console.log('Could not set process title:', error);
    }
  }

  public registerRenderer(window: BrowserWindow, config: ProcessConfig): void {
    const pid = window.webContents.getOSProcessId();
    this.processNames.set(pid, config);

    // Set window title for better identification
    const currentTitle = window.getTitle();
    const newTitle = `${this.appName} - ${config.name}`;
    if (currentTitle !== newTitle) {
      window.setTitle(newTitle);
    }

    // Set process title for the renderer process in the renderer context
    window.webContents
      .executeJavaScript(
        `
      (function() {
        try {
          // Set process title in renderer context
          if (typeof process !== 'undefined') {
            process.title = '${config.processName}';
          }
          
          // Also try to set document title
          document.title = '${config.processName}';
          
          // Set window name for better identification
          if (window.name !== '${config.processName}') {
            window.name = '${config.processName}';
          }
          
          console.log('Process title set to: ${config.processName}');
        } catch (error) {
          console.log('Could not set renderer process title:', error);
        }
      })();
    `
      )
      .catch(err => {
        console.log('Could not set renderer process title:', err);
      });

    // Try to set the process title at the OS level
    this.setProcessTitle(pid, config.processName);
  }

  public registerWorker(
    childProcess: ChildProcess,
    config: ProcessConfig
  ): void {
    if (!childProcess || !childProcess.pid) {
      return;
    }

    this.processNames.set(childProcess.pid!, config);

    // Set process title if possible
    if (childProcess.pid) {
      try {
        // Set the process title for the child process
        this.setProcessTitle(childProcess.pid, config.processName);

        // For Windows, try to set the title property
        if (process.platform === 'win32') {
          (childProcess as any).title = config.processName;
        }
      } catch (error) {
        console.log('Could not set worker process title:', error);
      }
    }

    // Clean up when process exits
    childProcess.on('exit', () => {
      this.processNames.delete(childProcess.pid!);
      console.log(
        `Worker process exited: ${config.name} (PID: ${childProcess.pid})`
      );
    });

    console.log(
      `Registered worker process: ${config.name} (PID: ${childProcess.pid}) as "${config.processName}"`
    );
  }

  // Register GPU process with custom name
  public registerGPUProcess(pid: number): void {
    const gpuConfig: ProcessConfig = {
      name: 'GPU Process',
      description: 'Electron GPU process for hardware acceleration',
      type: 'gpu',
      category: 'system',
      processName: 'Astra-GPU',
    };

    this.processNames.set(pid, gpuConfig);
    this.setProcessTitle(pid, gpuConfig.processName);
    console.log(
      `Registered GPU process (PID: ${pid}) as "${gpuConfig.processName}"`
    );
  }

  // Register Helper process with custom name
  public registerHelperProcess(
    pid: number,
    helperType: string = 'Helper'
  ): void {
    const helperConfig: ProcessConfig = {
      name: `${helperType} Process`,
      description: `Electron ${helperType.toLowerCase()} process`,
      type: 'helper',
      category: 'system',
      processName: `Astra-${helperType.replace(/\s+/g, '')}`,
    };

    this.processNames.set(pid, helperConfig);
    this.setProcessTitle(pid, helperConfig.processName);
    console.log(
      `Registered ${helperType} process (PID: ${pid}) as "${helperConfig.processName}"`
    );
  }

  // Register Utility process with custom name
  public registerUtilityProcess(pid: number, utilityType: string): void {
    const utilityConfig: ProcessConfig = {
      name: `${utilityType} Process`,
      description: `Electron ${utilityType.toLowerCase()} process`,
      type: 'utility',
      category: 'system',
      processName: `Astra-${utilityType.replace(/\s+/g, '')}`,
    };

    this.processNames.set(pid, utilityConfig);
    this.setProcessTitle(pid, utilityConfig.processName);
    console.log(
      `Registered ${utilityType} process (PID: ${pid}) as "${utilityConfig.processName}"`
    );
  }

  public getProcessInfo(pid: number): ProcessConfig | undefined {
    return this.processNames.get(pid);
  }

  public getAllProcesses(): Array<{ pid: number; config: ProcessConfig }> {
    return Array.from(this.processNames.entries()).map(([pid, config]) => ({
      pid,
      config,
    }));
  }

  public getProcessesByCategory(
    category: ProcessConfig['category']
  ): Array<{ pid: number; config: ProcessConfig }> {
    return this.getAllProcesses().filter(
      ({ config }) => config.category === category
    );
  }

  public getProcessesByType(
    type: ProcessConfig['type']
  ): Array<{ pid: number; config: ProcessConfig }> {
    return this.getAllProcesses().filter(({ config }) => config.type === type);
  }
}

// Create singleton instance
const processRegistry = new ProcessNamingRegistry();

// Predefined process configurations with unique process names
export const PROCESS_CONFIGS = {
  MAIN_UI: {
    name: 'Main',
    description: 'Primary application interface',
    type: 'renderer' as const,
    category: 'ui' as const,
    processName: 'Astra - Main',
  },
  STREAM_WINDOW: {
    name: 'Live Stream',
    description: 'Live streaming and screen sharing interface',
    type: 'renderer' as const,
    category: 'streaming' as const,
    processName: 'Astra - Live Stream',
  },
  WHITEBOARD: {
    name: 'Whiteboard',
    description: 'Interactive whiteboard interface',
    type: 'renderer' as const,
    category: 'whiteboard' as const,
    processName: 'Astra - Whiteboard',
  },
} as const;

// Export functions for easy use
export function registerMainUI(window: BrowserWindow): void {
  processRegistry.registerRenderer(window, PROCESS_CONFIGS.MAIN_UI);
}

export function registerStreamWindow(window: BrowserWindow): void {
  processRegistry.registerRenderer(window, PROCESS_CONFIGS.STREAM_WINDOW);
}

export function registerWhiteboardWindow(window: BrowserWindow): void {
  processRegistry.registerRenderer(window, PROCESS_CONFIGS.WHITEBOARD);
}

export function registerWorker(
  childProcess: ChildProcess,
  config: ProcessConfig
): void {
  processRegistry.registerWorker(childProcess, config);
}

export function registerGPUProcess(pid: number): void {
  processRegistry.registerGPUProcess(pid);
}

export function registerHelperProcess(
  pid: number,
  helperType: string = 'Helper'
): void {
  processRegistry.registerHelperProcess(pid, helperType);
}

export function registerUtilityProcess(pid: number, utilityType: string): void {
  processRegistry.registerUtilityProcess(pid, utilityType);
}

// Export the registry for advanced usage
export { processRegistry };
