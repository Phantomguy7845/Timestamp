// Log storage
const MAX_LOG_LINES = 200;
let logLines: string[] = [];
let logListeners: Array<(logs: string[]) => void> = [];

function timestamp(): string {
    return new Date().toLocaleTimeString('th-TH');
}

export function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    const line = `[${timestamp()}] ${prefix} ${message}`;

    logLines.push(line);
    if (logLines.length > MAX_LOG_LINES) {
        logLines = logLines.slice(-MAX_LOG_LINES);
    }

    // Notify listeners
    logListeners.forEach((fn) => fn([...logLines]));

    // Also console log
    if (level === 'error') console.error(message);
    else if (level === 'warn') console.warn(message);
    else console.log(message);
}

export function getLogs(): string[] {
    return [...logLines];
}

export function clearLogs(): void {
    logLines = [];
    logListeners.forEach((fn) => fn([]));
}

export function subscribeToLogs(callback: (logs: string[]) => void): () => void {
    logListeners.push(callback);
    return () => {
        logListeners = logListeners.filter((fn) => fn !== callback);
    };
}

export function copyLogs(): Promise<void> {
    return navigator.clipboard.writeText(logLines.join('\n'));
}

// Setup global error handlers
export function setupErrorHandlers(): void {
    window.onerror = (message, source, lineno, colno, error) => {
        log(`Error: ${message} at ${source}:${lineno}:${colno}`, 'error');
        if (error?.stack) {
            log(`Stack: ${error.stack}`, 'error');
        }
        return false;
    };

    window.onunhandledrejection = (event) => {
        log(`Unhandled rejection: ${event.reason}`, 'error');
    };

    log('App initialized');
}
