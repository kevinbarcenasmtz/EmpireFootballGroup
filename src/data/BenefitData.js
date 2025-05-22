import {
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  ClockIcon,
  HomeIcon,
} from '@heroicons/react/24/solid';

import benefitone from '../images/benefitone.jpg';
import benefittwo from '../images/benefittwo.jpg';

const benefitOne = {
  title: 'Affordable Pricing for All Teams',
  desc: 'We believe football should be accessible to everyone. Our simple, transparent pricing ensures no hidden fees or surprises just pure football enjoyment.',
  image: benefitone,
  bullets: [
    {
      title: 'Entry Fees',
      desc: "This is to be determined as season fees change dynamically! It's also team dependent.",
      icon: <CurrencyDollarIcon />,
    },
    {
      title: 'No Hidden Costs',
      desc: 'We aim to be as transparent as possible when communicating season costs and team costs.',
      icon: <ShieldCheckIcon />,
    },
    {
      title: 'Hassle-Free Experience',
      desc: 'From registration to game day, we make it simple and stress-free for you.',
      icon: <ClipboardDocumentCheckIcon />,
    },
  ],
};

const benefitTwo = {
  title: 'Community & Varying Levels of Skill',
  desc: "Our organization consists of various teams such as Invictus FC (AMSA) and Olympus FC (Bat City Soccer League), as such these teams play at various levels in their corresponding recreational league. Nevertheless, our teams are part of one close-knit community.",
  image: benefittwo,
  bullets: [
    {
      title: 'Cross-Divisional Experience',
      desc: 'Having teams across different divisions allows our players to progress as athletes corresponding to their journey as football players.',
      icon: <TrophyIcon />,
    },
    {
      title: 'Playing Time',
      desc: 'Another benefit of having multiple teams playing in Austin is the flexibility of ensuring players are receiving enough playing time.',
      icon: <ClockIcon />,
    },
    {
      title: 'One Large Community',
      desc: 'Despite having three distinct teams in our organization we encourage our players to foster relationships and to network across teams. As such we also host scrimmages across our teams to observe player and team progress.',
      icon: <HomeIcon />,
    },
  ],
};

export { benefitOne, benefitTwo };
