import { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

// Works just like useState, but the value survives page reloads.
// Example: const [notes, setNotes] = useLocalStorage('diet-notes', '');
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => loadFromStorage(key, initialValue));

  useEffect(() => {
    saveToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}
