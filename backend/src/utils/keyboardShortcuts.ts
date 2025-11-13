// frontend/src/utils/keyboardShortcuts.ts

type ShortcutHandler = (event: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: ShortcutHandler;
}

const registeredShortcuts: Shortcut[] = [];

export function registerShortcut(shortcut: Shortcut) {
  registeredShortcuts.push(shortcut);
}

export function unregisterShortcut(shortcut: Shortcut) {
  const index = registeredShortcuts.indexOf(shortcut);
  if (index > -1) {
    registeredShortcuts.splice(index, 1);
  }
}

function handleKeyDown(event: KeyboardEvent) {
  for (const shortcut of registeredShortcuts) {
    const { key, ctrlKey, shiftKey, altKey, handler } = shortcut;
    if (
      event.key.toLowerCase() === key.toLowerCase() &&
      (ctrlKey === undefined || event.ctrlKey === ctrlKey) &&
      (shiftKey === undefined || event.shiftKey === shiftKey) &&
      (altKey === undefined || event.altKey === altKey)
    ) {
      event.preventDefault(); // Prevent default browser action
      handler(event);
      return;
    }
  }
}

export function initializeKeyboardShortcuts() {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }
}

export function cleanupKeyboardShortcuts() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown);
  }
}
