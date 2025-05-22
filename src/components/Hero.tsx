import Image from 'next/image';
import { Container } from './Container';
import homeheroimage from '../images/homeheroimage.jpg';

export const Hero = () => {
  return (
    <Container className="flex flex-wrap items-center justify-center px-4 py-8 lg:justify-between lg:py-4">
      {/* Left section */}
      <div className="flex w-full flex-col items-center lg:w-1/2 lg:items-start lg:pr-8">
        <h1 className="text-smoky-black text-center text-3xl leading-tight font-bold tracking-tight lg:text-left lg:text-4xl xl:text-6xl">
          Welcome to Empire Football Group!
        </h1>
        <p className="py-5 text-center text-lg leading-relaxed text-gray-600 lg:text-left lg:text-xl xl:text-2xl">
          Join one of Austin&apos;s largest football organizations having many teams and being a avid
          member of Austin Men&apos;s Soccer Association for a long time now! We aspire to be one of Austin&apos;s most exciting and
          inclusive football communities where our main focus is affordability. Our organization is
          designed for players of all skills levels who are passionate about the beautiful game.
        </p>
        <div className="flex w-full flex-col items-center gap-4 sm:flex-row lg:justify-start">
          <a
            href='/about'
            rel="noopener"
            className="bg-penn-red hover:bg-lighter-red rounded-md px-8 py-4 text-center text-lg font-semibold text-white"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Right section */}
      <div className="mt-8 flex w-full items-center justify-center lg:mt-0 lg:w-1/2 lg:pl-6">
        <div className="w-full max-w-md lg:max-w-none">
          <Image
            src={homeheroimage}
            width={616}
            height={617}
            className="rounded-sm object-cover shadow-2xs"
            alt="Picture of some members of the Empire Football Team"
            loading="eager"
            placeholder="blur"
          ></Image>
        </div>
      </div>
    </Container>
  );
};
