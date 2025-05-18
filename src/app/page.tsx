import { Container } from '@/components/Container';
import { Hero } from '@/components/Hero';
import { SectionTitle } from '@/components/SectionTitle';
import { Benefits } from '@/components/Benefits';
import { benefitOne, benefitTwo } from '../data/BenefitData';
import { Faq } from '@/components/Faq';

export default function Home() {
  return (
    <main role="main">
      <Container>
        <Hero />

        {/* Section */}
        <SectionTitle
          preTitle="Why Join Empire Football Group?"
          title="Why you should join us and AMSA"
        />

        <section aria-labelledby="benefits-heading" className="mt-10">
          <h2 id="benefits-heading" className="sr-only">Benefits of Joining</h2>
          <div className="grid gap-10 md:grid-cols-3">
            <div className="bg-bone rounded-lg p-6 shadow-lg transition duration-300 hover:shadow-xl">
              <h3 className="text-penn-red text-xl font-semibold">Affordability</h3>
              <p className="mt-3 text-gray-600">
                One of the main goals of our organization is to provide an affordable program that allows
                Austin players to participate in one of the city’s most popular recreational leagues.
              </p>
            </div>
            <div className="bg-bone rounded-lg p-6 shadow-md transition duration-300 hover:shadow-xl">
              <h3 className="text-penn-red text-xl font-semibold">Community Engagement</h3>
              <p className="mt-3 text-gray-600">
                Be part of a league and organization that values community outreach. Participate in local events and
                support football initiatives. Our organization started from grassroots efforts and communal 
                initiatives, and we continue providing opportunities to others.
              </p>
            </div>
            <div className="bg-bone rounded-lg p-6 shadow-md transition duration-300 hover:shadow-xl">
              <h3 className="text-penn-red text-xl font-semibold">Player Spotlights</h3>
              <p className="mt-3 text-gray-600">
                Get recognized for your achievements on and off the field with monthly player spotlights
                and awards.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <Benefits imgPos="left" data={benefitOne} />
        <Benefits imgPos="right" data={benefitTwo} />

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="mt-16">
          <SectionTitle preTitle="FAQ" title="Frequently Asked Questions" />
          <Faq />
        </section>
      </Container>
    </main>
  );
}
