; Prevent warnings from being treated as errors
!define WARNINGS_ARE_ERRORS 0
!define MUI_WARNINGS_ARE_ERRORS 0

!macro customInstall
  ; Kill any running instances of Astra
  nsExec::ExecToStack 'taskkill /f /im "Astra Console.exe"'
  nsExec::ExecToStack 'taskkill /f /im "astra-electron.exe"'
  
  ; Wait for processes to close
  Sleep 2000
!macroend

!macro customUnInstall
  ; Kill any running instances of Astra
  nsExec::ExecToStack 'taskkill /f /im "Astra Console.exe"'
  nsExec::ExecToStack 'taskkill /f /im "astra-electron.exe"'
  
  ; Wait for processes to close
  Sleep 2000
!macroend
