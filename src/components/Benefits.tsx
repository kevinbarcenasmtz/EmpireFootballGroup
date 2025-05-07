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
  } & StaticImageData; // Tailwind-compatible image import
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
            <h3 className="text-smoky-black mt-3 max-w-2xl text-3xl leading-snug font-bold tracking-tight lg:text-4xl lg:leading-tight">
              {data.title}
            </h3>

            <p className="max-w-2xl py-4 text-lg leading-normal text-gray-600 lg:text-xl xl:text-xl">
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
  icon: React.ReactElement<{ className?: string }>;
  children: React.ReactNode;
}

function Benefit({ title, icon, children }: BenefitProps) {
  return (
    <div className="mt-8 flex items-start space-x-3">
      <div
        className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: '#9f1315' }}
      >
        {React.cloneElement(icon, {
          className: 'w-7 h-7 text-white',
        })}
      </div>
      <div>
        <h4 className="text-smoky-black text-xl font-medium">{title}</h4>
        <p className="mt-1 text-gray-600">{children}</p>
      </div>
    </div>
  );
}
