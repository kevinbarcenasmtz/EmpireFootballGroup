import { Container } from '@/components/Container';
import { Hero } from '@/components/Hero';
import { SectionTitle } from '@/components/SectionTitle';
import { Benefits } from '@/components/Benefits';
import { benefitOne, benefitTwo} from "../data/BenefitData";
import { Faq } from '@/components/Faq';

export default function Home() {
  return (
    <Container>
      <Hero />

      {/* Section */}
      <SectionTitle preTitle='Why Join Empire Football Group?' title='Why you should join us and AMSA'/>
        <div className="grid gap-10 mt-10 md:grid-cols-3">
          <div className="p-6 bg-bone rounded-lg shadow-lg ">
            <h3 className="text-xl font-semibold text-penn-red">
              Competitive Matches
            </h3>
            <p className="mt-3 text-gray-600">
              Experience weekly games with teams of all skill levels. Compete for the championship while building camaraderie.
            </p>
          </div>
          <div className="p-6 bg-bone rounded-lg shadow-md ">
            <h3 className="text-xl font-semibold text-penn-red ">
              Community Engagement
            </h3>
            <p className="mt-3 text-gray-600">
              Be part of a league that values community outreach. Participate in local events and support soccer initiatives.
            </p>
          </div>
        <div className="p-6 bg-bone rounded-lg shadow-md ">
          <h3 className="text-xl font-semibold text-penn-red ">
            Player Spotlights
          </h3>
          <p className="mt-3 text-gray-600">
            Get recognized for your achievements on and off the field with monthly player spotlights and awards.
          </p>
        </div>
        </div>

      {/* Benefits */ }
      <Benefits imgPos="left" data={benefitOne}/>
      <Benefits imgPos="right" data={benefitTwo}/>

      {/* Section Title for FAQ */}
      <SectionTitle preTitle='FAQ' title='Frequently Asked Questions'/>
      <Faq/>

    </Container>
);
}

