import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Heart, Settings } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#202026' }}>
      <style>{`
        :root {
          --primary: #FF6B6B;
          --background: #202026;
          --foreground: #FFFFFF;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          background-color: var(--background);
          color: var(--foreground);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden; /* Remove scroll horizontal */
        }
        
        /* Custom Scrollbar Styles */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #202026; /* Mesma cor do fundo da página */
        }

        ::-webkit-scrollbar-thumb {
          background: var(--primary);
          border-radius: 10px;
          border: 2px solid #202026; /* Mesma cor do fundo */
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #FF9A8B;
        }

        @keyframes heartFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 100px)) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Navigation only show on dashboard */}
      {location.pathname === createPageUrl("Dashboard") && (
        <nav className="fixed top-0 left-0 right-0 z-50 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <Link 
              to={createPageUrl("Home")} 
              className="flex items-center gap-2 text-white hover:text-[#FF6B6B] transition-colors"
            >
              <Heart className="w-6 h-6" />
              <span className="font-semibold">Ver História</span>
            </Link>
            <div className="flex items-center gap-2 text-[#FF6B6B]">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </div>
          </div>
        </nav>
      )}

      {/* Main content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
}
