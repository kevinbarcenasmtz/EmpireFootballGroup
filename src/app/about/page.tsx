import { Container } from '@/components/Container';
import Image from 'next/image';
import EmblaCarousel from '@/components/EmblaCarousel';
import PlayerCarousel from '@/components/PlayerCarousel';
import { EmblaOptionsType } from 'embla-carousel';
import { CreativeCredits } from '@/components/CreativeCredits';

// Import player data
import { IMPERIUM_PLAYERS, INVICTUS_PLAYERS } from '@/data/PlayerData';

// Import your carousel images
import empfballgroupteam from '../../images/carousel/empfootballgroupteam.jpg';
import empteam from '../../images/carousel/empireteam.jpg';
import invictusteam from '../../images/carousel/invictusteam.jpg';

import imperiumlogo from '../../images/logos/imperiumfclogo.png';
import invictuslogo from '../../images/logos/invictuslogo.png';
import olympuslogo from '../../images/logos/olympusfc.png';
import sponsor1 from '../../images/logos/bluealberthlogo.png';
import sponsor2 from '../../images/logos/albert_logo.png';

const OPTIONS: EmblaOptionsType = { loop: true }
const PLAYER_OPTIONS: EmblaOptionsType = { align: 'start', containScroll: 'trimSnaps' }

// Array of images for the carousel
const CAROUSEL_IMAGES = [
  empfballgroupteam,
  empteam,
  invictusteam
  // Add more images here as you get them
];

export default function AboutUs() {
  return (
    <Container className="py-12">
      {/* Welcome Section */}
      <section aria-labelledby="welcome-heading" className="mb-16 text-center">
        <h1 id="welcome-heading" className="text-penn-red mb-4 text-5xl font-bold">
          Welcome to Empire Football Group
        </h1>
        <p className="text-text-primary mx-auto mb-8 max-w-4xl text-lg leading-relaxed">
          Empire Football Group is, at its core, an organization where football players around
          Austin can participate in some of the largest recreational football leagues in Austin,
          Texas — the{' '}
          <a
            href="https://austinmenssoccer.com/"
            className="text-blue-600 underline transition-colors duration-200 hover:text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            Austin Men&apos;s Football Association
          </a>{' '}
          and the{' '}
          <a
            href="https://batcitysoccersevens.leagueapps.com/"
            className="text-blue-600 underline transition-colors duration-200 hover:text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bat City Soccer League
          </a>
          .
        </p>
        <p className="text-text-primary mx-auto mb-8 max-w-4xl text-lg leading-relaxed">
          Growing up in South Austin, the majority of our inaugural team has played at the Onion
          Creek Fields throughout their youth. From pickup games to after-school kick-arounds, our
          organization is built on a deep love for football and a focus on affordability. Originally
          established as Dolfgang FC, we&apos;ve evolved into a more structured group that will
          continue to grow alongside Austin&apos;s thriving football community. As of 2025, we are
          proud to have three teams: Imperium FC (AMSA Division I), Invictus FC (AMSA Division II),
          and Olympus FC (Bat City Soccer League).
        </p>
        
        {/* Image Carousel replacing the landscape photo */}
        <div className="mx-auto w-full max-w-5xl">
          <EmblaCarousel images={CAROUSEL_IMAGES} options={OPTIONS} />
        </div>
      </section>

      {/* Mission Section */}
      <section
        aria-labelledby="mission-heading"
        className="bg-contrast mb-16 rounded-lg border border-gray-200 p-8 shadow-md dark:border-gray-700"
      >
        <h2
          id="mission-heading"
          className="text-text-primary mb-6 text-center text-4xl font-semibold"
        >
          OUR MISSION
        </h2>
        <p className="text-text-secondary mx-auto max-w-3xl text-center text-lg leading-relaxed">
          Uniting communities through the love of football. Whether you&apos;re an experienced
          player or new to the game, our teams welcome everyone. Football has the unique power to
          connect people, and we&apos;re committed to fostering a friendly environment where players
          can enjoy the sport and build lasting connections.
        </p>
      </section>

      {/* Imperium FC Section */}
      <section
        aria-labelledby="imperium-heading"
        className="mb-16"
      >
        {/* Team Banner */}
        <div className="from-lighter-red mb-8 rounded-lg bg-gradient-to-r to-transparent p-8 shadow-md">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="flex justify-center md:w-1/3">
              <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-white p-4 shadow-lg">
                <Image
                  src={imperiumlogo}
                  alt="Imperium FC team logo"
                  width={200}
                  height={200}
                  className="object-contain transition-transform duration-300 hover:scale-120"
                  priority
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <h2
                id="imperium-heading"
                className="text-text-primary mb-4 text-center text-4xl font-extrabold md:text-left"
              >
                Imperium FC
              </h2>
              <p className="text-text-primary mb-6 text-lg">
                Imperium FC stands as our flagship competitive program, representing the initial team
                and pilot group of our community. Founded with the vision to develop talent and
                compete at the highest level of AMSA, Imperium FC embodies our commitment to technical
                skill, tactical awareness, and athleticism—while keeping community at the core.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-background rounded-lg border border-gray-200 p-4 shadow dark:border-gray-700">
                  <h4 className="text-lighter-red mb-2 font-bold">Competition Level</h4>
                  <p className="text-text-primary">Premier and Division I</p>
                </div>
                <div className="bg-background rounded-lg border border-gray-200 p-4 shadow dark:border-gray-700">
                  <h4 className="text-lighter-red mb-2 font-bold">Training Commitment</h4>
                  <p className="text-text-primary">
                    Coaching with structured weekly training sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Player Showcase - Now outside the banner */}
        <div className="mt-8">
          <h3 className="text-text-primary mb-6 text-center text-2xl font-bold">
            Meet Our Players
          </h3>
          <PlayerCarousel 
            players={IMPERIUM_PLAYERS} 
            options={PLAYER_OPTIONS}
            teamColor="lighter-red"
          />
        </div>
      </section>

      {/* Invictus FC Section */}
      <section
        aria-labelledby="invictus-heading"
        className="mb-16"
      >
        {/* Team Banner */}
        <div className="from-dark-goldenrod mb-8 rounded-lg bg-gradient-to-r to-transparent p-8 shadow-md">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="flex justify-center md:w-1/3">
              <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-white p-4 shadow-lg">
                <Image
                  src={invictuslogo}
                  alt="Invictus FC team logo"
                  width={200}
                  height={200}
                  className="object-contain transition-transform duration-300 hover:scale-110"
                  priority
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <h2
                id="invictus-heading"
                className="text-text-primary mb-4 text-center text-4xl font-extrabold md:text-left"
              >
                Invictus FC
              </h2>
              <p className="text-text-primary mb-6 text-lg">
                Invictus FC is our development and second-division team built to give more players a
                chance to compete and grow. Invictus fosters player improvement and team cohesion
                through structured training while preparing players to eventually contribute at the
                top level.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-background rounded-lg border border-gray-200 p-4 shadow dark:border-gray-700">
                  <h4 className="text-dark-goldenrod mb-2 font-bold">Competition Level</h4>
                  <p className="text-text-primary">Division II</p>
                </div>
                <div className="bg-background rounded-lg border border-gray-200 p-4 shadow dark:border-gray-700">
                  <h4 className="text-dark-goldenrod mb-2 font-bold">Training Commitment</h4>
                  <p className="text-text-primary">Regular coaching and team-building practices.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Player Showcase - Now outside the banner */}
        <div className="mt-8">
          <h3 className="text-text-primary mb-6 text-center text-2xl font-bold">
            Meet Our Players
          </h3>
          <PlayerCarousel 
            players={INVICTUS_PLAYERS} 
            options={PLAYER_OPTIONS}
            teamColor="dark-goldenrod"
          />
        </div>
      </section>

      {/* Olympus FC Section */}
      <section
        aria-labelledby="olympus-heading"
        className="from-lapis-lazuli mb-16 rounded-lg bg-gradient-to-r to-transparent p-8 shadow-md"
      >
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
          <div className="flex justify-center md:w-1/3">
            <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-white p-4 shadow-lg">
              <Image
                src={olympuslogo}
                alt="Olympus FC team logo"
                width={200}
                height={200}
                className="object-contain transition-transform duration-300 hover:scale-140"
                priority
              />
            </div>
          </div>
          <div className="md:w-2/3">
            <h2
              id="olympus-heading"
              className="text-text-primary mb-4 text-center text-4xl font-extrabold md:text-left"
            >
              Olympus FC
            </h2>
            <p className="text-text-primary mb-6 text-lg">
              Olympus FC represents our entry into the Bat City Soccer League, expanding our
              competitive reach beyond traditional AMSA play. This team provides players with a
              different style of football experience while maintaining our core values of
              affordability and community-focused competition.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-background rounded-lg border border-gray-200 p-4 shadow dark:border-gray-700">
                <h4 className="text-lapis-lazuli mb-2 font-bold">Competition Level</h4>
                <p className="text-text-primary">Bat City Soccer League</p>
              </div>
              <div className="bg-background rounded-lg border border-gray-200 p-4 shadow dark:border-gray-700">
                <h4 className="text-lapis-lazuli mb-2 font-bold">League Focus</h4>
                <p className="text-text-primary">
                  Alternative competitive format with community emphasis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Creative Credits - Add before sponsors */}
      <CreativeCredits />

      {/* Sponsors Section */}
      <section aria-labelledby="sponsors-heading" className="mb-16 text-center">
        <h2 id="sponsors-heading" className="text-text-primary mb-10 text-4xl font-semibold">
          OUR SPONSORS
        </h2>
        <p id="sponsor-description" className="text-text-primary mb-5 text-xl font-normal">
          Our uniform sponsor/manufacturer for a year now has been Alberth Jerseys! We&apos;re proud
          to be sponsored by him and his company as they do wonderful work and provide us with top
          quality jerseys for our different teams.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <Image
            src={sponsor1}
            alt="Sponsor 1 logo"
            width={150}
            height={80}
            className="object-contain"
          />
          <Image
            src={sponsor2}
            alt="Sponsor 2 logo"
            width={150}
            height={80}
            className="object-contain"
          />
        </div>
      </section>
    </Container>
  );
}