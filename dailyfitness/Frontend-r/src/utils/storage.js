// Tiny wrapper around localStorage so the rest of the app never has to
// worry about JSON.parse/stringify or missing keys.

export function loadFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable - fail silently, app still works in memory
  }
}

export function removeFromStorage(key) {
  localStorage.removeItem(key);
}

export function clearStorage() {
  localStorage.clear();
}
