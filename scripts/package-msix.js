const { packageMSIX } = require('electron-windows-msix');
const path = require('path');
const fs = require('fs');

async function packageMSIXApp() {
  try {
    console.log('Starting MSIX packaging...');

    // Read package.json for version and app info
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    const appName = packageJson.name;

    // Read electron-builder config for appId
    const electronBuilderConfig = JSON.parse(
      fs.readFileSync('electron-builder-appx.json', 'utf8')
    );
    const appId = electronBuilderConfig.appId;

    // MSIX requires version in format: major.minor.build.revision
    // Convert semantic version to MSIX format
    const versionParts = version.split('.');
    const msixVersion =
      versionParts.length >= 3
        ? `${versionParts[0]}.${versionParts[1]}.${versionParts[2]}.0`
        : `${version}.0.0.0`;

    // Define paths - try different possible locations
    let appDir = path.join(
      __dirname,
      '..',
      'dist-electron-builder',
      'win-unpacked'
    );

    // If win-unpacked doesn't exist, try the dist-electron-builder directory itself
    if (!fs.existsSync(appDir)) {
      appDir = path.join(__dirname, '..', 'dist-electron-builder');
    }

    // Ensure the directory path is normalized
    appDir = path.normalize(appDir);

    // Try to resolve any symlinks or relative paths
    try {
      appDir = fs.realpathSync(appDir);
      console.log('✅ Resolved real path:', appDir);
    } catch (error) {
      console.warn('⚠️  Could not resolve real path:', error.message);
    }
    const outputDir = path.join(__dirname, '..', 'dist-electron-builder');
    const assetsDir = path.join(__dirname, '..', 'assets', 'appx');

    // Check if the unpacked app exists
    if (!fs.existsSync(appDir)) {
      console.error(`❌ App directory not found: ${appDir}`);
      console.log('📁 Available directories in dist-electron-builder:');
      const distDir = path.join(__dirname, '..', 'dist-electron-builder');
      if (fs.existsSync(distDir)) {
        const contents = fs.readdirSync(distDir);
        contents.forEach(item => {
          const itemPath = path.join(distDir, item);
          const stats = fs.statSync(itemPath);
          console.log(`  ${item} (${stats.isDirectory() ? 'dir' : 'file'})`);
        });
      } else {
        console.log('  dist-electron-builder directory does not exist');
      }
      throw new Error(`App directory not found: ${appDir}`);
    }

    // Additional validation for electron-windows-msix
    console.log('🔍 Validating app directory structure...');
    const requiredFiles = ['Astra Console.exe', 'resources', 'locales'];

    for (const file of requiredFiles) {
      const filePath = path.join(appDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ Found: ${file}`);
      } else {
        console.warn(`⚠️  Missing: ${file}`);
      }
    }

    // List all files in the app directory for debugging
    console.log('📁 All files in app directory:');
    if (fs.existsSync(appDir)) {
      const allFiles = fs.readdirSync(appDir);
      allFiles.forEach(file => {
        const filePath = path.join(appDir, file);
        const stats = fs.statSync(filePath);
        console.log(
          `  ${file} (${stats.isDirectory() ? 'dir' : 'file'}) - ${stats.size} bytes`
        );
      });
    }

    // Check if assets directory exists
    if (!fs.existsSync(assetsDir)) {
      console.warn(`Assets directory not found: ${assetsDir}, creating it...`);
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    console.log('App directory:', appDir);
    console.log('Output directory:', outputDir);
    console.log('Assets directory:', assetsDir);

    // Check if the executable exists
    const executablePath = path.join(appDir, 'Astra Console.exe');
    if (!fs.existsSync(executablePath)) {
      console.error(`❌ Executable not found: ${executablePath}`);
      console.log('📁 Available files in app directory:');
      if (fs.existsSync(appDir)) {
        const contents = fs.readdirSync(appDir);
        contents.forEach(item => {
          const itemPath = path.join(appDir, item);
          const stats = fs.statSync(itemPath);
          console.log(`  ${item} (${stats.isDirectory() ? 'dir' : 'file'})`);
        });
      }
      throw new Error(`Executable not found: ${executablePath}`);
    }
    console.log('✅ Executable found:', executablePath);
    console.log('📦 Using MSIX version:', msixVersion);

    // MSIX packaging configuration - simplified
    const msixConfig = {
      appDir: appDir,
      outputDir: outputDir,
      packageAssets: assetsDir,
      manifestVariables: {
        publisher: 'CN=ALLEN CAREER INSTITUTE PRIVATE LIMITED',
        publisherDisplayName: 'ALLEN CAREER INSTITUTE PRIVATE LIMITED',
        packageIdentity: 'AllenCareerInstitute.AstraConsole',
        packageVersion: msixVersion,
        packageDisplayName: 'Astra Console',
        packageDescription:
          'Astra Console Electron App with WebView and Video Streaming',
        packageBackgroundColor: '#ffffff',
        appExecutable: 'Astra Console.exe',
        appDisplayName: 'Astra Console',
        targetArch: 'x64',
        packageMinOSVersion: '10.0.19041.0',
        packageMaxOSVersionTested: '10.0.19041.0',
      },
      packageName: `${appName}-${msixVersion}.msix`,
      createPri: true,
      sign: false,
      logLevel: 'info',
    };

    console.log('MSIX configuration:', JSON.stringify(msixConfig, null, 2));

    // Additional debugging
    console.log('🔍 Final validation before packaging:');
    console.log(`  App directory exists: ${fs.existsSync(msixConfig.appDir)}`);
    console.log(`  App directory path: ${msixConfig.appDir}`);
    console.log(
      `  Output directory exists: ${fs.existsSync(msixConfig.outputDir)}`
    );
    console.log(
      `  Assets directory exists: ${fs.existsSync(msixConfig.packageAssets)}`
    );

    // Try to access the directory to ensure it's readable
    try {
      const testRead = fs.readdirSync(msixConfig.appDir);
      console.log(
        `✅ Directory is readable, contains ${testRead.length} items`
      );
    } catch (error) {
      console.error(`❌ Directory access error: ${error.message}`);
      throw error;
    }

    // Try alternative approach - create a minimal config file
    console.log('🔧 Trying alternative configuration approach...');

    // Try using forward slashes instead of backslashes
    const normalizedAppDir = appDir.replace(/\\/g, '/');
    const normalizedOutputDir = outputDir.replace(/\\/g, '/');
    const normalizedAssetsDir = assetsDir.replace(/\\/g, '/');

    // Try creating a temporary copy of the app directory
    const tempAppDir = path.join(__dirname, '..', 'temp-msix-app');
    console.log('📁 Creating temporary app directory:', tempAppDir);

    // Remove temp directory if it exists
    if (fs.existsSync(tempAppDir)) {
      fs.rmSync(tempAppDir, { recursive: true, force: true });
    }

    // Copy the app directory to temp
    fs.cpSync(appDir, tempAppDir, { recursive: true });
    console.log('✅ Copied app directory to temp location');

    const minimalConfig = {
      appDir: tempAppDir.replace(/\\/g, '/'),
      outputDir: normalizedOutputDir,
      packageAssets: normalizedAssetsDir,
      manifestVariables: {
        publisher: msixConfig.manifestVariables.publisher,
        publisherDisplayName: msixConfig.manifestVariables.publisherDisplayName,
        packageIdentity: msixConfig.manifestVariables.packageIdentity,
        packageVersion: msixConfig.manifestVariables.packageVersion,
        packageDisplayName: msixConfig.manifestVariables.packageDisplayName,
        packageDescription: msixConfig.manifestVariables.packageDescription,
        packageBackgroundColor:
          msixConfig.manifestVariables.packageBackgroundColor,
        appExecutable: msixConfig.manifestVariables.appExecutable,
        appDisplayName: msixConfig.manifestVariables.appDisplayName,
        targetArch: msixConfig.manifestVariables.targetArch,
        packageMinOSVersion: msixConfig.manifestVariables.packageMinOSVersion,
        packageMaxOSVersionTested:
          msixConfig.manifestVariables.packageMaxOSVersionTested,
      },
      packageName: msixConfig.packageName,
      createPri: false, // Disable PRI creation to simplify
      sign: false,
      logLevel: 'debug', // Use debug level for more info
    };

    console.log(
      'Minimal MSIX configuration:',
      JSON.stringify(minimalConfig, null, 2)
    );

    // Package the MSIX
    console.log('🚀 Starting MSIX packaging with minimal config...');
    // try {
    await packageMSIX(minimalConfig);
    // } catch (error) {
    //   console.error('❌ MSIX packaging error details:');
    //   console.error('Error message:', error.message);
    //   console.error('Error stack:', error.stack);

    //   // Try with even simpler config
    //   console.log('🔄 Trying with even simpler configuration...');
    //   const simplestConfig = {
    //     appDir: msixConfig.appDir,
    //     outputDir: msixConfig.outputDir,
    //     manifestVariables: {
    //       publisher: msixConfig.manifestVariables.publisher,
    //       packageIdentity: msixConfig.manifestVariables.packageIdentity,
    //       packageVersion: msixConfig.manifestVariables.packageVersion,
    //       packageDisplayName: msixConfig.manifestVariables.packageDisplayName,
    //       appExecutable: msixConfig.manifestVariables.appExecutable,
    //       targetArch: 'x64', // Add back targetArch as it's required
    //     },
    //     packageName: msixConfig.packageName,
    //     sign: false,
    //     logLevel: 'debug',
    //   };

    //   console.log(
    //     'Simplest MSIX configuration:',
    //     JSON.stringify(simplestConfig, null, 2)
    //   );
    //   await packageMSIX(simplestConfig);
    // }

    // Verify the MSIX file was created
    const msixFilePath = path.join(outputDir, msixConfig.packageName);
    if (!fs.existsSync(msixFilePath)) {
      throw new Error(`MSIX file was not created: ${msixFilePath}`);
    }

    console.log('✅ MSIX packaging completed successfully!');
    console.log(`📦 MSIX file created: ${msixFilePath}`);
    console.log(
      `📊 File size: ${(fs.statSync(msixFilePath).size / 1024 / 1024).toFixed(2)} MB`
    );

    // Cleanup temporary directory
    const tempDirToClean = path.join(__dirname, '..', 'temp-msix-app');
    if (fs.existsSync(tempDirToClean)) {
      fs.rmSync(tempDirToClean, { recursive: true, force: true });
      console.log('🧹 Cleaned up temporary directory');
    }
  } catch (error) {
    console.error('❌ MSIX packaging failed:', error);
    process.exit(1);
  }
}

// Run the packaging
packageMSIXApp();
