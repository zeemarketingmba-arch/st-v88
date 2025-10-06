
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// FIX: Correctly typed the hook's return value with `Dispatch<SetStateAction<T>>` to resolve a "Cannot find namespace 'React'" error.
function useLocalStorage<T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // دالة للحصول على القيمة الأولية من localStorage أو استخدام القيمة الافتراضية
  const readValue = (): T => {
    // لا يتم تنفيذ هذا الكود من جانب الخادم
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // دالة لتحديث القيمة في localStorage
  // FIX: Explicitly typed the `setValue` constant with `Dispatch<SetStateAction<T>>` for type safety.
  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    // منع التنفيذ من جانب الخادم
    if (typeof window == 'undefined') {
      console.warn(`Tried setting localStorage key “${key}” even though environment is not a client`);
    }

    try {
      // السماح بتحديث القيمة كدالة للحصول على نفس واجهة برمجة تطبيقات useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // حفظ الحالة
      setStoredValue(valueToStore);
      // حفظ في localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  // تأثير لمزامنة التغييرات عبر التبويبات
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(readValue());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [storedValue, setValue];
}

export default useLocalStorage;
