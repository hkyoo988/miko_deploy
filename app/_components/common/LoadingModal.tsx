import React from 'react';

const LoadingModal: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
    <div className="bg-white rounded-lg p-5 shadow-lg flex items-center">
      <div className="loader"></div>
      <p className="ml-3 text-lg">Loading...</p>
    </div>
    <style jsx>{`
      .loader {
        border: 4px solid #f3f3f3;
        border-radius: 50%;
        border-top: 4px solid #3498db;
        width: 40px;
        height: 40px;
        animation: spin 2s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default LoadingModal;
