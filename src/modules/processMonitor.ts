import {
  registerHelperProcess,
  registerGPUProcess,
  registerUtilityProcess,
} from './processNaming';
import { ProcessMetric, app } from 'electron';

// Get all app metrics to identify Electron processes
const monitorProcesses = () => {
  try {
    const metrics = app.getAppMetrics();

    metrics.forEach((metric: ProcessMetric) => {
      const pid = metric.pid;

      // Skip if already registered
      if (pid === process.pid) return;

      // Identify and name GPU processes
      if (metric.type === 'GPU') {
        registerGPUProcess(pid);
      } else if (metric.type === 'Utility') {
        registerUtilityProcess(pid, 'Utility');
      } else if (metric.type === 'Tab') {
        registerHelperProcess(pid, 'Tab');
      }
    });
    // Set main process name for OS task manager visibility
    process.title = 'Astra-Main';
  } catch (error) {
    console.log('Error monitoring processes:', error);
  }
};

// Function to automatically detect and name Electron processes
export function setupAutomaticProcessNaming(): void {
  // Monitor processes periodically
  setInterval(monitorProcesses, 5000);

  // Initial check
  monitorProcesses();
}
