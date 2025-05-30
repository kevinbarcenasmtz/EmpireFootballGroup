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
                  <DisclosureButton className="text-text-primary bg-contrast focus-visible:ring-opacity-75 flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-4 text-left text-lg hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-100 dark:border-gray-700 dark:hover:bg-gray-800">
                    <span>{item.question}</span>
                    <ChevronUpIcon
                      className={`${open ? 'rotate-180 transform' : ''} text-penn-red h-5 w-5`}
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="text-text-secondary px-4 pt-4 pb-2">
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
    question: 'What is the age range for players in this organization?',
    answer:
      "The league is open to players aged 18-40. There's leagues for over 40 players but more information can be found on the Austin Men's Soccer Association website. As for the Bat City Soccer League that is also dependent, but it has a popular demographic of young adults.",
  },
  {
    question: 'How do I join the league?',
    answer:
      "We encourage you to follow us on social media, especially Instagram as that's the one we keep up with the most. We usually host tryouts before the season starts but that's not to say we don't encourage players trying out mid season. So feel free to fill out the contact form in the contact tab on this website and we will get back you as soon as we can.",
  },
  {
    question: 'When does the season start and end?',
    answer:
      'AMSA has seasons year round with the usual time ranges being a Fall, Spring, and Summer leagues. For confirmation we encourage you to checkout the AMSA website or just contact us! As for Bat City Soccer League, their league has a weekday gameday structure which allows for flexibility for busier adults so checkout our about us page.',
  },
  {
    question: 'Where are the matches played?',
    answer:
      'Matches are played across Austin but most of the league games are at the Onion Creek Complex in South Austin. For Bat City Soccer League, their games are played at Ojeda Middle School.',
  },
];
