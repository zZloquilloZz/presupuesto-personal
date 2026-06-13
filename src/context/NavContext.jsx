// NavContext.jsx — navegación con parámetros para drill-down.
// Permite que una pantalla salte a otra pasando filtros (ej: click en
// una categoría del Dashboard → Registro filtrado por esa categoría).

import { createContext, useContext } from "react";

const NavContext = createContext(null);

export function NavProvider({ go, page, params, children }) {
  return (
    <NavContext.Provider value={{ go, page, params }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav debe usarse dentro de <NavProvider>");
  return ctx;
}
