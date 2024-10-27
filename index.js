import { Workspace } from './.vscode/lib/workspace.js';

const workspace = new Workspace();

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  workspace.shutdown();
  process.exit();
});

// Start the workspace
console.log('🚀 Starting development workspace...');
workspace.setup().then(() => {
  workspace.setupWatchers();
}).catch(error => {
  console.error('❌ Initial setup failed:', error.message);
  console.log('👀 Watching for changes to retry...');
  workspace.setupWatchers();
});
