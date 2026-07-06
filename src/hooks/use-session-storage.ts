const setStorageItem = <T>(key: string, value: T) =>
  sessionStorage.setItem(key, JSON.stringify(value));

const getStorageItem = (key: string) => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    return JSON.parse(sessionStorage.getItem(key) as string) || null;
  }
};

const removeStorageItem = (key: string) => sessionStorage.removeItem(key);
const clearStorageItem = () => sessionStorage.clear();

export { setStorageItem, getStorageItem, removeStorageItem, clearStorageItem };
