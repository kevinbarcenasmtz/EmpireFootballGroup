'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import empirelogo from '../images/logos/empirefootballgrouplogo.png';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Standings', href: '/standings' },
    { name: 'Calendar', href: '/calendar' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="bg-contrast sticky top-0 z-50 w-full border-b border-gray-200 shadow-md shadow-gray-200 dark:border-gray-800 dark:shadow-black">
      <nav className="container mx-auto flex max-w-screen-xl items-center justify-between px-6 py-4 lg:px-8 xl:px-16">
        {/* Logo */}
        <div className="flex flex-grow items-center space-x-2 lg:flex-grow-0">
          <Image src={empirelogo} alt="Company Logo" className="w-6 sm:w-8" />
          <span className="text-text-primary font-semibold">Empire Football Group</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden text-center lg:flex lg:items-center">
          <ul className="flex-1 list-none items-center justify-center lg:flex">
            {navigation.map((menu, index) => (
              <li className="nav__item mr-3" key={index}>
                <Link
                  href={menu.href}
                  className="text-text-primary hover:text-penn-red focus:bg-penn-red inline-block rounded-md px-4 py-2 text-lg font-light no-underline transition-colors duration-200 focus:text-white focus:outline-none lg:text-sm"
                >
                  {menu.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Menu Button */}
        <button
          aria-label="Toggle Menu"
          onClick={toggleMenu}
          className="text-text-primary hover:text-penn-red focus:bg-penn-red absolute top-4 right-4 rounded-md px-2 py-1 transition-colors duration-200 focus:text-white focus:outline-none lg:hidden"
        >
          <svg
            className="h-6 w-6 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2z"
              />
            )}
          </svg>
        </button>

        {/* Mobile Menu Panel */}
        {isMenuOpen && (
          <div className="bg-background fixed inset-0 z-[100] lg:hidden">
            <div className="flex h-full w-full flex-col items-start justify-start p-4">
              <button
                aria-label="Close Menu"
                onClick={closeMenu}
                className="text-text-primary hover:text-penn-red focus:bg-penn-red mb-6 self-end rounded-md transition-colors duration-200 focus:text-white focus:outline-none"
              >
                <svg
                  className="h-6 w-6 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                  />
                </svg>
              </button>

              <div className="flex max-h-[50%] w-full flex-col items-start justify-start">
                {navigation.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={closeMenu}
                    className="text-md text-text-primary hover:bg-penn-red w-full border-b border-gray-200 px-2 py-2 transition-colors duration-200 hover:text-white dark:border-gray-700"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};
