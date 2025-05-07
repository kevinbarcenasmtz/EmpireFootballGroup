import { Container } from '@/components/Container';
import { Hero } from '@/components/Hero';
import { SectionTitle } from '@/components/SectionTitle';
import { Benefits } from '@/components/Benefits';
import { benefitOne, benefitTwo } from '../data/BenefitData';
import { Faq } from '@/components/Faq';

export default function Home() {
  return (
    <Container>
      <Hero />

      {/* Section */}
      <SectionTitle
        preTitle="Why Join Empire Football Group?"
        title="Why you should join us and AMSA"
      />
      <div className="mt-10 grid gap-10 md:grid-cols-3">
        <div className="bg-bone rounded-lg p-6 shadow-lg">
          <h3 className="text-penn-red text-xl font-semibold">Competitive Matches</h3>
          <p className="mt-3 text-gray-600">
            Experience weekly games with teams of all skill levels. Compete for the championship
            while building camaraderie.
          </p>
        </div>
        <div className="bg-bone rounded-lg p-6 shadow-md">
          <h3 className="text-penn-red text-xl font-semibold">Community Engagement</h3>
          <p className="mt-3 text-gray-600">
            Be part of a league that values community outreach. Participate in local events and
            support soccer initiatives.
          </p>
        </div>
        <div className="bg-bone rounded-lg p-6 shadow-md">
          <h3 className="text-penn-red text-xl font-semibold">Player Spotlights</h3>
          <p className="mt-3 text-gray-600">
            Get recognized for your achievements on and off the field with monthly player spotlights
            and awards.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <Benefits imgPos="left" data={benefitOne} />
      <Benefits imgPos="right" data={benefitTwo} />

      {/* Section Title for FAQ */}
      <SectionTitle preTitle="FAQ" title="Frequently Asked Questions" />
      <Faq />
    </Container>
  );
}
