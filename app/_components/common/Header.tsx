import React, { ReactNode } from "react";

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => (
  <header className="bg-[#96a0fe] bg-opacity-80 p-4 text-center text-lg font-bold text-white w-full z-50">
    {children}
  </header>
);

export default Header;
