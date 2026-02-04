// FILE: components/Navbar.js
// Navigation bar component

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiShield, FiMenu, FiX, FiUser, FiLogOut, FiHome, FiSearch, FiFileText } from 'react-icons/fi';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: FiHome },
    { href: '/dashboard', label: 'Dashboard', icon: FiSearch, protected: true },
  ];

  const isActive = (path) => router.pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
              <FiShield className="w-8 h-8" />
              <span className="font-bold text-xl hidden sm:block">Nexora</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              if (link.protected && !isAuthenticated) return null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 ${
                    isActive(link.href)
                      ? 'text-primary-600 font-semibold'
                      : 'text-gray-600 hover:text-primary-600'
                  } transition-colors`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-primary-600 p-2"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-slideIn">
          <div className="px-4 py-3 space-y-3">
            {navLinks.map((link) => {
              if (link.protected && !isAuthenticated) return null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-2 ${
                    isActive(link.href)
                      ? 'text-primary-600 font-semibold'
                      : 'text-gray-600'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 py-2 border-t border-gray-200 pt-3">
                  <FiUser className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 py-2 text-red-600 w-full"
                >
                  <FiLogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-200">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary text-center"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
