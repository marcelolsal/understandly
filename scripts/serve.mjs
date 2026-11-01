// Keep the default listener on this machine. LAN binding must be explicit.
process.env.HOST ??= '127.0.0.1';
process.env.PORT ??= '4321';
await import('../dist/server/entry.mjs');
