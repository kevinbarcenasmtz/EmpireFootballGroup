'use client';
import React from 'react';
import { Container } from '@/components/Container';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/solid';

export const Faq = () => {
  return (
    <Container className="!p-0">
      <div className="mx-auto w-full max-w-2xl rounded-2xl p-2">
        {faqdata.map(item => (
          <div key={item.question} className="mb-5">
            <Disclosure>
              {({ open }) => (
                <div>
                  <DisclosureButton className="text-smoky-black bg-bone focus-visible:ring-opacity-75 flex w-full items-center justify-between rounded-lg px-4 py-4 text-left text-lg hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-100">
                    <span>{item.question}</span>
                    <ChevronUpIcon
                      className={`${open ? 'rotate-180 transform' : ''} text-penn-red h-5 w-5`}
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="px-4 pt-4 pb-2 text-gray-600">
                    {item.answer}
                  </DisclosurePanel>
                </div>
              )}
            </Disclosure>
          </div>
        ))}
      </div>
    </Container>
  );
};

const faqdata = [
  {
    question: 'What is the age range for players in the league?',
    answer:
      'The league is open to players aged 18-40. Special divisions may exist for younger or older players.',
  },
  {
    question: 'How do I join the league?',
    answer:
      'Visit our registration page or contact us via email/phone to sign up. Team and individual registrations are available.',
  },
  {
    question: 'When does the season start and end?',
    answer: 'Our seasons run year round, check our league schedules for more information.',
  },
  {
    question: 'Where are the matches played?',
    answer: 'Matches are played at Akins Highschool Futsal court.',
  },
];
