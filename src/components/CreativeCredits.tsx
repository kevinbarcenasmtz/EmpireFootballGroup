import React from 'react';
import { Container } from './Container';

export const CreativeCredits = () => {
  return (
    <section className="bg-contrast mb-4 py-6 mt-8">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-text-primary mb-6 text-3xl font-bold">Behind the Lens</h2>

          <div className="bg-background rounded-lg border border-gray-200 p-8 shadow-lg dark:border-gray-700">
            <div className="mb-6">
              <h3 className="text-penn-red mb-2 text-2xl font-semibold">Sarah Poliuc</h3>
              <p className="text-text-secondary text-lg">
                Creative Director • Photographer • Graphic Designer
              </p>
            </div>

            <p className="text-text-primary mb-6 text-lg leading-relaxed">
              All photography, graphic design, and marketing materials for Empire Football Group are
              created by the talented Sarah Poliuc. Her creative vision brings our teams to life
              through stunning visuals and professional branding.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <p className="text-text-secondary text-sm font-medium">Photo by Sarah Poliuc</p>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary text-sm">Follow her work:</span>
                <a
                  href="https://www.instagram.com/sorahflora/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-penn-red hover:bg-lighter-red inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
                >
                  <Instagram size={18} />
                  @sorahflora
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

const Instagram = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M16.98 0a6.9 6.9 0 0 1 5.08 1.98A6.94 6.94 0 0 1 24 7.02v9.96c0 2.08-.68 3.87-1.98 5.13A7.14 7.14 0 0 1 16.94 24H7.06a7.06 7.06 0 0 1-5.03-1.89A6.96 6.96 0 0 1 0 16.94V7.02C0 2.8 2.8 0 7.02 0h9.96zm.05 2.23H7.06c-1.45 0-2.7.43-3.53 1.25a4.82 4.82 0 0 0-1.3 3.54v9.92c0 1.5.43 2.7 1.3 3.58a5 5 0 0 0 3.53 1.25h9.88a5 5 0 0 0 3.53-1.25 4.73 4.73 0 0 0 1.4-3.54V7.02a5 5 0 0 0-1.3-3.49 4.82 4.82 0 0 0-3.54-1.3zM12 5.76c3.39 0 6.2 2.8 6.2 6.2a6.2 6.2 0 0 1-12.4 0 6.2 6.2 0 0 1 6.2-6.2zm0 2.22a3.99 3.99 0 0 0-3.97 3.97A3.99 3.99 0 0 0 12 15.92a3.99 3.99 0 0 0 3.97-3.97A3.99 3.99 0 0 0 12 7.98zm6.44-3.77a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z" />
  </svg>
);
