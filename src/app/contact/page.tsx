import React from 'react';
import Link from 'next/link';

export default function Contact() {
  return (
    <div className="min-h-screen bg-bone">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-penn-red to-red-400 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold mb-4">Contact Us</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Ready to join Empire Football Group or have questions about our teams? We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Main Contact Form Link */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-smoky-black mb-6">Get In Touch</h2>
            <p className="text-lg text-smoky-black mb-8 leading-relaxed">
              Whether you&apos;re interested in joining one of our teams, have questions about our teams, 
              or want to learn more about Empire Football Group, fill out our contact form and we&apos;ll get back to you soon.
            </p>
            
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSe9up8OxOSNzbZCDIZu4yvuZO_gUR3WKG9URaEWVwYujU2f_w/viewform?usp=dialog" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-penn-red hover:bg-red-500 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Contact Us via Form
            </a>
          </div>

          {/* Additional Info */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-penn-red mb-3">Join Our Teams</h3>
              <p className="text-smoky-black">
                Interested in playing for Imperium FC, Invictus FC, or Olympus FC? Let us know your experience level and preferences.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-penn-red mb-3">General Questions</h3>
              <p className="text-smoky-black">
                Have questions about our leagues, training schedules, or team fees? We&apos;re here to help with any inquiries.
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-penn-red mb-3">Partnerships</h3>
              <p className="text-smoky-black">
                Interested in partnering with Empire Football Group or sponsorship opportunities? Reach out to discuss possibilities.
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link 
              href="/"
              className="inline-block text-penn-red hover:text-red-400 font-semibold text-lg underline transition-colors duration-300"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}