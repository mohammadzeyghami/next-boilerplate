import React, { createContext, useContext } from "react";

const RequiredSectionContext = createContext(false);

type RequiredSectionProviderProps = {
  enabled?: boolean;
  children: React.ReactNode;
};

export const RequiredSectionProvider = ({
  enabled = false,
  children,
}: RequiredSectionProviderProps) => {
  return (
    <RequiredSectionContext.Provider value={Boolean(enabled)}>
      {children}
    </RequiredSectionContext.Provider>
  );
};

export const useRequiredSection = () => {
  return useContext(RequiredSectionContext);
};
