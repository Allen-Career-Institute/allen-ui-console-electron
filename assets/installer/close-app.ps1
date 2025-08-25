# PowerShell script to close Astra application
# This script can be used for process management and cleanup

param(
    [string]$AppName = "Astra"
)

Write-Host "Attempting to close $AppName..."

# Function to close processes gracefully
function Close-ProcessGracefully {
    param([string]$ProcessName)
    
    try {
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($processes) {
            Write-Host "Found $($processes.Count) instance(s) of $ProcessName"
            
            foreach ($process in $processes) {
                Write-Host "Attempting to close process ID: $($process.Id)"
                
                # Try to close gracefully first
                $process.CloseMainWindow() | Out-Null
                
                # Wait for the process to close
                if (!$process.WaitForExit(5000)) {
                    Write-Host "Process did not close gracefully, forcing termination..."
                    $process.Kill()
                    $process.WaitForExit(3000) | Out-Null
                }
                
                Write-Host "Process $($process.Id) closed successfully"
            }
        } else {
            Write-Host "No running instances of $ProcessName found"
        }
    } catch {
        Write-Host "Error closing $ProcessName : $($_.Exception.Message)"
    }
}

# Function to close processes by executable name
function Close-ProcessByExecutable {
    param([string]$ExecutableName)
    
    try {
        $processes = Get-Process | Where-Object { $_.ProcessName -like "*$ExecutableName*" }
        if ($processes) {
            Write-Host "Found $($processes.Count) process(es) matching $ExecutableName"
            
            foreach ($process in $processes) {
                Write-Host "Closing process: $($process.ProcessName) (ID: $($process.Id))"
                
                # Try to close gracefully first
                $process.CloseMainWindow() | Out-Null
                
                # Wait for the process to close
                if (!$process.WaitForExit(5000)) {
                    Write-Host "Process did not close gracefully, forcing termination..."
                    $process.Kill()
                    $process.WaitForExit(3000) | Out-Null
                }
            }
        }
    } catch {
        Write-Host "Error closing processes matching $ExecutableName : $($_.Exception.Message)"
    }
}

# Close specific process names
Close-ProcessGracefully "Astra"
Close-ProcessGracefully "astra-electron"

# Close processes by executable name patterns
Close-ProcessByExecutable "astra-electron"
Close-ProcessByExecutable "Astra"

# Additional cleanup using WMI for stubborn processes
try {
    Write-Host "Performing additional cleanup..."
    
    # Kill any remaining processes with similar names
    Get-WmiObject -Class Win32_Process | Where-Object { 
        $_.Name -like "*Astra*" -or 
        $_.Name -like "*astra-electron*" 
    } | ForEach-Object {
        Write-Host "Terminating process: $($_.Name) (ID: $($_.ProcessId))"
        $_.Terminate()
    }
} catch {
    Write-Host "Error during WMI cleanup: $($_.Exception.Message)"
}

Write-Host "Application closure process completed"
