import React from 'react';
import Link from 'next/link';

export default function Contact() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <div className="from-penn-red bg-gradient-to-r to-red-400 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-5xl font-extrabold">Contact Us</h1>
          <p className="mx-auto max-w-2xl text-xl">
            Ready to join Empire Football Group or have questions about our teams? We&apos;d love to
            hear from you.
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          {/* Main Contact Form Link */}
          <div className="mb-12 text-center">
            <h2 className="text-text-primary mb-6 text-3xl font-bold">Get In Touch</h2>
            <p className="text-text-primary mb-8 text-lg leading-relaxed">
              Whether you&apos;re interested in joining one of our teams, have questions about our
              teams, or want to learn more about Empire Football Group, fill out our contact form
              and we&apos;ll get back to you soon.
            </p>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSe9up8OxOSNzbZCDIZu4yvuZO_gUR3WKG9URaEWVwYujU2f_w/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-penn-red inline-block transform rounded-lg px-8 py-4 text-lg font-bold text-white shadow-lg transition-colors duration-300 hover:scale-105 hover:bg-red-500 hover:shadow-xl"
            >
              Contact Us via Form
            </a>
          </div>

          {/* Additional Info */}
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="bg-contrast rounded-lg border border-gray-200 p-6 text-center shadow-md dark:border-gray-700">
              <h3 className="text-penn-red mb-3 text-xl font-bold">Join Our Teams</h3>
              <p className="text-text-primary">
                Interested in playing for Imperium FC, Invictus FC, or Olympus FC? Let us know your
                experience level and preferences.
              </p>
            </div>

            <div className="bg-contrast rounded-lg border border-gray-200 p-6 text-center shadow-md dark:border-gray-700">
              <h3 className="text-penn-red mb-3 text-xl font-bold">General Questions</h3>
              <p className="text-text-primary">
                Have questions about our leagues, training schedules, or team fees? We&apos;re here
                to help with any inquiries.
              </p>
            </div>

            <div className="bg-contrast rounded-lg border border-gray-200 p-6 text-center shadow-md dark:border-gray-700">
              <h3 className="text-penn-red mb-3 text-xl font-bold">Partnerships</h3>
              <p className="text-text-primary">
                Interested in partnering with Empire Football Group or sponsorship opportunities?
                Reach out to discuss possibilities.
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="text-penn-red inline-block text-lg font-semibold underline transition-colors duration-300 hover:text-red-400"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
