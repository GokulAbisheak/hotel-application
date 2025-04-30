import React from 'react';
import { FaFacebookF, FaInstagram, FaTwitter, FaGooglePlusG, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8 mt-12 shadow-xl">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Social Icons */}
        <div className="flex gap-4 text-xl">
          <a href="#" className="bg-white text-black p-3 rounded-full hover:scale-110 transition"><FaFacebookF /></a>
          <a href="#" className="bg-white text-black p-3 rounded-full hover:scale-110 transition"><FaInstagram /></a>
          <a href="#" className="bg-white text-black p-3 rounded-full hover:scale-110 transition"><FaTwitter /></a>
          <a href="#" className="bg-white text-black p-3 rounded-full hover:scale-110 transition"><FaGooglePlusG /></a>
          <a href="#" className="bg-white text-black p-3 rounded-full hover:scale-110 transition"><FaYoutube /></a>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <a href="/" className="hover:underline">Home</a>
          <a href="/news" className="hover:underline">News</a>
          <a href="/about" className="hover:underline">About</a>
          <a href="/contact" className="hover:underline">Contact Us</a>
          <a href="/team" className="hover:underline">Our Team</a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-gray-400">
          Copyright ©2025, Designed by <span className="text-white font-medium">FAHEEM</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
