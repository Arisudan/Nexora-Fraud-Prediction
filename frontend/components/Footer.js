// FILE: components/Footer.js
// Footer component with enhanced styling

import { FiShield, FiGithub, FiTwitter, FiMail, FiHeart } from 'react-icons/fi';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiShield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Nexora</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Predict scams before they happen using the power of crowd intelligence. 
              Join our community to protect yourself and others from fraud.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-xl flex items-center justify-center transition-all hover:scale-110">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-xl flex items-center justify-center transition-all hover:scale-110">
                <FiGithub className="w-5 h-5" />
              </a>
              <a href="mailto:support@fraudpredictor.com" className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-xl flex items-center justify-center transition-all hover:scale-110">
                <FiMail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Report Fraud
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Safety Tips
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm flex items-center gap-1">
            © {currentYear} Nexora Fraud Predictor. Made with <FiHeart className="w-4 h-4 text-red-500" /> for a safer internet.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-gray-500 hover:text-purple-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
