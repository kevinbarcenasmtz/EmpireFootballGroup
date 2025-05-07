import {
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  CalendarDaysIcon,
  BanknotesIcon,
} from '@heroicons/react/24/solid';

import benefitone from '../images/benefitone.jpg';
import benefittwo from '../images/benefittwo.jpg';

const benefitOne = {
  title: 'Affordable Pricing for All Teams',
  desc: 'We believe soccer should be accessible to everyone. Our simple, transparent pricing ensures no hidden fees or surprises just pure soccer enjoyment.',
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
  title: 'Exciting Formats and Features',
  desc: 'Our league stands out with unique features designed to maximize enjoyment, competitiveness, and affordability. From thrilling tournament formats to no hidden fees, we ensure every player has an unforgettable experience.',
  image: benefittwo,
  bullets: [
    {
      title: 'Champions League Format',
      desc: 'Winners of each seasonal league compete in a grand Champions League during the summer for ultimate bragging rights.',
      icon: <TrophyIcon />,
    },
    {
      title: 'Dynamic Scheduling',
      desc: 'With four games per day and a well-paced schedule, participants can enjoy matches without overwhelming time commitments.',
      icon: <CalendarDaysIcon />,
    },
    {
      title: 'No Hidden Fees',
      desc: 'All-inclusive entry fees—no referee charges or ID checks—make it simple and affordable for teams to join and play.',
      icon: <BanknotesIcon />,
    },
  ],
};

export { benefitOne, benefitTwo };
