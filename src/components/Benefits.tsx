import Image from 'next/image';
import React from 'react';
import { Container } from '@/components/Container';
import type { StaticImageData } from 'next/image';

interface BulletItem {
  title: string;
  desc: string;
  icon: React.ReactElement;
}

interface BenefitsData {
  imgPos?: 'left' | 'right';
  title: string;
  desc: string;
  image: {
    src: string;
  } & StaticImageData;
  bullets: BulletItem[];
}

interface BenefitsProps {
  imgPos?: 'left' | 'right';
  data: BenefitsData;
}

export const Benefits: React.FC<BenefitsProps> = ({ data, imgPos }) => {
  return (
    <Container className="mb-20 flex flex-wrap lg:flex-nowrap lg:gap-10">
      {/* Image section */}
      <div
        className={`flex w-full items-center justify-center lg:w-1/2 ${
          imgPos === 'right' ? 'lg:order-1' : ''
        }`}
      >
        <div>
          <Image
            src={data.image}
            width={521}
            height={600}
            alt="Benefits"
            className="object-cover"
            placeholder="blur"
            blurDataURL={data.image.src}
          />
        </div>
      </div>

      {/* Text section */}
      <div
        className={`flex w-full flex-wrap items-center lg:w-1/2 ${
          imgPos === 'right' ? 'lg:justify-end' : ''
        }`}
      >
        <div>
          <div className="mt-4 flex w-full flex-col">
            <h3 className="text-text-primary mt-3 max-w-2xl text-3xl leading-snug font-bold tracking-tight lg:text-4xl lg:leading-tight">
              {data.title}
            </h3>
            <p className="text-text-secondary max-w-2xl py-4 text-lg leading-normal lg:text-xl xl:text-xl">
              {data.desc}
            </p>
          </div>
          <div className="mt-5 w-full">
            {data.bullets.map((item, index) => (
              <Benefit key={index} title={item.title} icon={item.icon}>
                {item.desc}
              </Benefit>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
};

interface BenefitProps {
  title: string;
  icon: React.ReactElement;
  children: React.ReactNode;
}

function Benefit({ title, icon, children }: BenefitProps) {
  return (
    <div className="mt-8 flex items-start space-x-3">
      <div
        className="bg-penn-red mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md"
        // Replaced inline style with Tailwind class for consistency
      >
        {React.cloneElement(icon, {
          className: 'w-7 h-7 text-white',
        } as React.SVGProps<SVGSVGElement>)}
      </div>
      <div>
        <h4 className="text-text-primary text-xl font-medium">{title}</h4>
        <p className="text-text-secondary mt-1">{children}</p>
      </div>
    </div>
  );
}
