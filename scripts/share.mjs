// Show the current chapter through a tunnel without exposing personal state or CLI execution.
process.env.UNDERSTANDLY_SHARE_MODE = '1';
process.env.PORT ??= '4322';
await import('./serve.mjs');
