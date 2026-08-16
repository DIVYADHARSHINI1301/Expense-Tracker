import { createContext, useContext, useState } from 'react';

const SpaceContext = createContext();

export const useSpace = () => {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error('useSpace must be used within SpaceProvider');
  return ctx;
};

export const SpaceProvider = ({ children }) => {
  // activeSpace stores the accountId of the currently active account
  // null means "first account" (resolved at render time)
  const [activeSpace, setActiveSpace] = useState(null);

  return (
    <SpaceContext.Provider value={{ activeSpace, setActiveSpace }}>
      {children}
    </SpaceContext.Provider>
  );
};
