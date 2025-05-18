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
    question: 'What is the age range for players in this organization?',
    answer:
      "The league is open to players aged 18-40. There's leagues for over 40 players but more information can be found on the Austin Men's Soccer Association website.",
  },
  {
    question: 'How do I join the league?',
    answer:
      "We encourage you to follow us on social media, especially Instagram as that's the one we keep up with the most. We usually host tryouts before the season starts but that's not to say we don't encourage players trying out mid season. So feel free to drop a DM to our Instagram account and we will try to get back to you ASAP.",
  },
  {
    question: 'When does the season start and end?',
    answer: "AMSA has seasons year round with the usual time ranges being a Fall, Spring, and Summer leagues. For confirmation we encourage you to checkout the AMSA website or just contact us!",
  },
  {
    question: 'Where are the matches played?',
    answer: 'Matches are played across Austin but most of the league games are at the Onion Creek Complex in South Austin.',
  },
];
