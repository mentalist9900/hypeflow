const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if we need to build
const buildNeeded = !fs.existsSync(path.join(__dirname, 'build', 'index.html'));

console.log('Starting HypeFlow deployment process...');

try {
  // Build the React app if needed
  if (buildNeeded) {
    console.log('Building React application...');
    
    // Set CI=false for the build process (works on both Windows and Linux)
    const env = { ...process.env };
    env.CI = 'false';
    
    try {
      execSync('npx react-scripts build', { 
        stdio: 'inherit',
        env: env
      });
      console.log('Build completed successfully.');
    } catch (buildError) {
      console.error('Build failed, but continuing with existing files:', buildError.message);
    }
  } else {
    console.log('Build folder already exists, skipping build step.');
  }

  // Start the server
  console.log('Starting server on port 3002...');
  require('./server.js');
} catch (error) {
  console.error('Error during startup:', error);
  process.exit(1);
} 
