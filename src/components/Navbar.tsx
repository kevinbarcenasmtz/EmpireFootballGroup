"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import empirelogo from "../images/empirelogo.png";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    // { name: "Leagues", href: "/league" },
    { name: "Standings", href: "/standings" },
    { name: "Calendar", href: "/calendar" },
    { name: "Contact", href: "/contact" },
    { name: "Blog", href: "/blog" },
  ];

  return (
    <div className="w-full sticky top-0 z-50 bg-bone shadow-md shadow-bone-100/50 ">
      <nav className="container flex items-center justify-between px-6 py-4 mx-auto lg:px-8 xl:px-16 max-w-screen-xl">
        {/* Logo */}
        <div className="flex items-center space-x-2 flex-grow lg:flex-grow-0">
          <Image
            src={empirelogo}
            width={24}
            height={24}
            alt="Company Logo"
            className="w-6 sm:w-8"
          />
          <span className="font-bold">Empire Football League</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden text-center lg:flex lg:items-center">
          <ul className="items-center justify-center flex-1 list-none lg:flex">
            {navigation.map((menu, index) => (
              <li className="mr-3 nav__item" key={index}>
                <Link
                  href={menu.href}
                  className="inline-block px-4 py-2 text-lg font-light text-smoky-black no-underline rounded-md hover:text-penn-red focus:text-white focus:bg-penn-red focus:outline-none lg:text-sm"
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
          className="absolute top-4 right-4 px-2 py-1 text-smoky-black rounded-md lg:hidden hover:text-penn-red focus:text-white focus:bg-penn-red focus:outline-none"
        >
          <svg
            className="w-6 h-6 fill-current"
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
          <div className="fixed inset-0 z-[100] bg-bone lg:hidden">
            <div className="flex flex-col items-start justify-start w-full h-full p-4">
              <button
                aria-label="Close Menu"
                onClick={closeMenu}
                className="self-end mb-6 text-smoky-black rounded-md hover:text-penn-red focus:text-white focus:bg-penn-red focus:outline-none "
              >
                <svg
                  className="w-6 h-6 fill-current"
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

              <div className="flex flex-col items-start justify-start w-full max-h-[50%]">
                {navigation.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={closeMenu}
                    className="w-full px-2 py-2 text-md text-smoky-black border-b hover:bg-penn-red "
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