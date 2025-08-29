import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProtectedRoutes, type ProtectedRoute } from '../../../app/routes';

export default function Header() {
  const [isHidden, setIsHidden] = useState(false);
  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-900">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <span className="flex items-center space-x-3 rtl:space-x-reverse">
          <img
            src="https://flowbite.com/docs/images/logo.svg"
            className="h-8"
            alt="Flowbite Logo"
          />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            Flowbite
          </span>
        </span>
        <button
          data-collapse-toggle="navbar-default"
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-controls="navbar-default"
          aria-expanded={isHidden}
          onClick={() => setIsHidden(!isHidden)}
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>
        <div
          className={`w-full md:block md:w-auto ${!isHidden ? 'hidden' : ''}`}
          id="navbar-default"
          aria-expanded={isHidden}
          aria-hidden={!isHidden}
          aria-label="main menu"
        >
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            {ProtectedRoutes.map((link: ProtectedRoute) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  aria-current={link.path === location.pathname ? 'page' : undefined}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        block py-2 px-3 text-blue-700 rounded-sm md:bg-transparent md:text-blue-700 md:p-0 dark:text-white md:dark:text-blue-500
        active:outline-none "
                  onClick={() => setIsHidden(!isHidden)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
