import { spawn } from 'node:child_process';

export class RuntimeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
  }
}

// Never attach stdout/stderr or the environment to errors: they may contain secrets.
export function runProcess({ executable, args, input = '', env, cwd, signal,
  timeoutMs = 90000, maxBytes = 4 * 1024 * 1024 }) {
  if (signal?.aborted) return Promise.reject(new RuntimeError('CANCELLED', 'Consulta cancelada.'));
  return new Promise((resolve, reject) => {
    const grouped = process.platform !== 'win32';
    let child;
    try {
      child = spawn(executable, args, { cwd, env, shell: false,
        detached: grouped, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    } catch {
      reject(new RuntimeError('START_FAILED', 'No se pudo iniciar el CLI.'));
      return;
    }
    let stdout = '', stderr = '', bytes = 0, failure, killTimer;
    const terminate = () => {
      const kill = (name) => {
        try {
          if (grouped && child.pid) process.kill(-child.pid, name);
          else child.kill(name);
        } catch { /* already exited */ }
      };
      kill('SIGTERM');
      killTimer ??= setTimeout(() => kill('SIGKILL'), 1000);
      killTimer.unref();
    };
    const fail = (code, message) => {
      if (failure) return;
      failure = new RuntimeError(code, message);
      terminate();
    };
    const abort = () => fail('CANCELLED', 'Consulta cancelada.');
    const timer = setTimeout(() => fail('TIMEOUT', 'El CLI superó el tiempo máximo.'), timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      clearTimeout(killTimer);
      signal?.removeEventListener('abort', abort);
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    const collect = (stream) => (chunk) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxBytes) {
        fail('OUTPUT_LIMIT', 'El CLI superó el límite de respuesta.');
        return;
      }
      if (stream === 'stdout') stdout += chunk.toString();
      else stderr += chunk.toString();
    };
    // Decode streams incrementally so split UTF-8 characters survive chunk boundaries.
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', collect('stdout'));
    child.stderr.on('data', collect('stderr'));
    child.stdin.on('error', () => {}); // EPIPE if a CLI fails before reading input.
    child.once('error', (error) => {
      cleanup();
      reject(new RuntimeError(error.code === 'ENOENT' ? 'CLI_NOT_FOUND' : 'START_FAILED',
        'No se pudo iniciar el CLI; comprueba su ruta y permisos.'));
    });
    child.once('close', (exitCode) => {
      cleanup();
      if (failure) reject(failure);
      else resolve({ stdout, stderr, exitCode });
    });
    child.stdin.end(input);
  });
}
