import { Container } from "@/components/Container";
// import { FaFutbol, FaUsers, FaMapMarkerAlt, FaHandshake } from "react-icons/fa";
import Image from "next/image";
import landscapePhoto from "../../images/aboutusphoto.jpg";
import imperiumlogo from "../../images/logos/imperiumfclogo.png";
import invictuslogo from "../../images/logos/invictuslogo.png";
import sponsor1 from "../../images/logos/bluealberthlogo.png";
import sponsor2 from "../../images/logos/albert_logo.png";

export default function AboutUs() {
  return (
    <Container className="py-12">
      {/* Welcome Section */}
      <section aria-labelledby="welcome-heading" className="text-center mb-16">
        <h1 id="welcome-heading" className="text-5xl font-bold text-penn-red mb-4">
          Welcome to Empire Football Group
        </h1>
        <p className="text-lg text-smoky-black leading-relaxed max-w-4xl mx-auto mb-8">
          Empire Football Group is, at its core, an organization where football players around Austin can participate in one of the largest recreational football leagues in Austin, Texas — the{' '}
          <a href="https://austinmensfootball.com/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            Austin Men&apos;s Football Association.
          </a>
        </p>
        <p className="text-lg text-smoky-black leading-relaxed max-w-4xl mx-auto mb-8">
          Growing up in South Austin, the majority of our inaugural team has played at the Onion Creek Fields throughout their youth. From pickup games to after-school kick-arounds, our organization is built on a deep love for football and a focus on affordability. Originally established as Dolfgang FC, we&apos;ve evolved into a more structured group that will continue to grow alongside Austin’s thriving football community. As of 2025, we are proud to have three teams: Imperium FC (Division I), Invictus FC (Division II), and Olympus FC (Division II/III TBD).
        </p>
        {/* Landscape Photo */}
        <div className="relative w-full h-72 lg:h-96 max-w-5xl mx-auto rounded-lg overflow-hidden shadow-lg">
          <Image
            src={landscapePhoto}
            alt="Football field with players at sunset"
            fill
            style={{ objectFit: "cover" }}
            className="rounded-md transition-all duration-500 ease-in-out"
            priority
          />
        </div>
      </section>

      {/* Mission Section */}
      <section aria-labelledby="mission-heading" className="bg-bone p-8 rounded-lg shadow-md mb-16">
        <h2 id="mission-heading" className="text-4xl font-semibold text-center text-smoky-black mb-6">
          OUR MISSION
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed text-center max-w-3xl mx-auto">
          Uniting communities through the love of football. Whether you&apos;re an experienced player or new to the game, our teams welcome everyone. Football has the unique power to connect people, and we&apos;re committed to fostering a friendly environment where players can enjoy the sport and build lasting connections.
        </p>
      </section>

      {/* Imperium FC Section */}
      <section aria-labelledby="imperium-heading" className="mb-16 bg-gradient-to-r from-lighter-red to-transparent p-8 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="md:w-1/3 flex justify-center">
            <div className="w-64 h-64 relative flex items-center justify-center bg-white rounded-full shadow-lg p-4">
              <Image
                src={imperiumlogo}
                alt="Imperium FC team logo"
                width={200}
                height={200}
                className="object-contain transition-transform duration-300 hover:scale-105"
                priority
              />
            </div>
          </div>
          <div className="md:w-2/3">
            <h2 id="imperium-heading" className="text-4xl font-extrabold text-black mb-4 text-center md:text-left">
              Imperium FC
            </h2>
            <p className="text-lg text-smoky-black mb-6">
              Imperium FC stands as our flagship competitive program, representing the initial team and pilot group of our community. Founded with the vision to develop talent and compete at the highest level of AMSA, Imperium FC embodies our commitment to technical skill, tactical awareness, and athleticism—while keeping community at the core.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-bone p-4 rounded-lg shadow">
                <h4 className="font-bold text-lighter-red mb-2">Competition Level</h4>
                <p className="text-smoky-black">Premier and Division I</p>
              </div>
              <div className="bg-bone p-4 rounded-lg shadow">
                <h4 className="font-bold text-lighter-red mb-2">Training Commitment</h4>
                <p className="text-smoky-black">Coaching with structured weekly training sessions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Invictus FC Section */}
      <section aria-labelledby="invictus-heading" className="mb-16 bg-gradient-to-r from-dark-goldenrod to-transparent p-8 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="md:w-1/3 flex justify-center">
            <div className="w-64 h-64 relative flex items-center justify-center bg-white rounded-full shadow-lg p-4">
              <Image
                src={invictuslogo}
                alt="Invictus FC team logo"
                width={200}
                height={200}
                className="object-contain transition-transform duration-300 hover:scale-105"
                priority
              />
            </div>
          </div>
          <div className="md:w-2/3">
            <h2 id="invictus-heading" className="text-4xl font-extrabold text-smoky-black mb-4 text-center md:text-left">
              Invictus FC
            </h2>
            <p className="text-lg text-smoky-black mb-6">
              Invictus FC is our development and second-division team built to give more players a chance to compete and grow. Invictus fosters player improvement and team cohesion through structured training while preparing players to eventually contribute at the top level.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-bone p-4 rounded-lg shadow">
                <h4 className="font-bold text-dark-goldenrod mb-2">Competition Level</h4>
                <p className="text-smoky-black">Division II</p>
              </div>
              <div className="bg-bone p-4 rounded-lg shadow">
                <h4 className="font-bold text-dark-goldenrod mb-2">Training Commitment</h4>
                <p className="text-smoky-black">Regular coaching and team-building practices.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section aria-labelledby="sponsors-heading" className="mb-16 text-center">
        <h2 id="sponsors-heading" className="text-4xl font-semibold text-smoky-black mb-10">
          OUR SPONSORS
        </h2>
        <div className="flex flex-wrap justify-center gap-8 items-center">
          <Image src={sponsor1} alt="Sponsor 1 logo" width={150} height={80} className="object-contain grayscale hover:grayscale-0 transition duration-300" />
          <Image src={sponsor2} alt="Sponsor 2 logo" width={150} height={80} className="object-contain grayscale hover:grayscale-0 transition duration-300" />
        </div>
      </section>
    </Container>
  );
}
