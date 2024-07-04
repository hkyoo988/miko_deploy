"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Header from "../_components/common/Header";

const ErrorPage: React.FC = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push("/waiting");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header>MIKO Board</Header>
      <main className="flex flex-col items-center justify-center flex-1">
        <h1 className="text-4xl mb-4">Error</h1>
        <p className="text-xl mb-8">
          The meeting you are looking for does not exist.
        </p>
        <button
          onClick={handleBack}
          className="p-2 bg-blue-500 text-white rounded-md"
        >
          Go Back
        </button>
      </main>
    </div>
  );
};

export default ErrorPage;
