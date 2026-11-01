// Sharing is deliberately a separate process: a tunnel can rewrite Host/Origin.
// Never infer permission to access personal state from those headers.
export const isSharedPreview = () => process.env.UNDERSTANDLY_SHARE_MODE === '1';
