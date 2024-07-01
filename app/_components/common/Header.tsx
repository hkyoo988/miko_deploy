import React, { ReactNode } from "react";
import styles from "../../styles/Header.module.css";

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => (
  <header className={styles.header}>{children}</header>
);

export default Header;
