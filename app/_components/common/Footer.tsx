import React, { ReactNode } from "react";
import styles from "../../styles/Footer.module.css";

interface FooterProps {
  children: ReactNode;
  isFixed?: boolean;
}

const Footer: React.FC<FooterProps> = ({ children, isFixed }) => (
  <footer className={`${styles.footer} ${isFixed ? styles.fixed : ""}`}>
    {children}
  </footer>
);

export default Footer;
