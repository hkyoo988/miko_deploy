"use client";

import React, { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";

const LoginPage: React.FC = () => {
  const router = useRouter();

  const handleGoogleLogin = (e: FormEvent) => {
    e.preventDefault();
    signIn("google");
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>MIKO</h1>
        <h2 style={styles.subtitle}>Login to get started</h2>
        <div style={styles.socialLogin}>
          <button style={styles.googleButton} onClick={handleGoogleLogin}>
            <Image src="/google.png" alt="Google Icon" width={24} height={24} />
            <span style={styles.googleButtonText}>Login with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#96A0FE",
  },
  loginBox: {
    backgroundColor: "#FFF",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    textAlign: "center" as const,
  },
  title: {
    fontSize: "48px",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "18px",
    marginBottom: "20px",
  },
  socialLogin: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  },
  googleButton: {
    display: "flex",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#FFF",
    border: "1px solid #CCC",
    borderRadius: "4px",
    cursor: "pointer",
  },
  googleButtonText: {
    marginLeft: "10px",
    fontSize: "16px",
    fontWeight: "bold" as const,
  },
  footer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
  },
  link: {
    color: "#6C63FF",
    textDecoration: "none",
  },
};

export default LoginPage;
