#!/usr/bin/env node

import { run } from '../src/cli.js';

try {
  await run();
} catch (err) {
  // Handle Ctrl+C gracefully (inquirer throws ExitPromptError)
  if (err.name === 'ExitPromptError') {
    console.log('\n  Cancelled.');
    process.exit(0);
  }
  console.error('\n  Error:', err.message);
  process.exit(1);
}
