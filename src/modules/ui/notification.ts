// Development mode flag (set to false for production)
const DEBUG_MODE = false;

// Debug logger function
export function debugLog(...args: any[]): void {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

export function resetNotificationClasses(dialog: HTMLElement): void {
    dialog.classList.remove('dsa-dialog-show', 'dsa-dialog-fade-in', 'dsa-dialog-fade-out');
}

export function fadeIn(dialog: HTMLElement): void {
    setTimeout(() => {
        dialog.classList.add('dsa-dialog-show');
        setTimeout(() => {
            dialog.classList.add('dsa-dialog-fade-in');
        }, 10);
    }, 0);
}

export function fadeOut(dialog: HTMLElement, delay: number = 5000): void {
    setTimeout(() => {
        dialog.classList.remove('dsa-dialog-fade-in');
        dialog.classList.add('dsa-dialog-fade-out');
        setTimeout(() => {
            dialog.classList.remove('dsa-dialog-show', 'dsa-dialog-fade-out');
        }, 600);
    }, delay);
}

export function showMessage(message: string, dialog_in?: HTMLElement | null) {
    const dialog = (dialog_in) ? dialog_in : document.querySelector<HTMLElement>(".dsa-dialog");
    if (!dialog) return;
    dialog.textContent = message;
    resetNotificationClasses(dialog);
    fadeIn(dialog);
    fadeOut(dialog);
}

export function loadNotificationStyles(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles/notifications.css');
    document.head.appendChild(link);
}
