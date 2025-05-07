import Image from "next/image";
import React from "react";
import { Container } from "@/components/Container";
import type { StaticImageData } from "next/image";


interface BulletItem {
  title: string;
  desc: string;
  icon: React.ReactElement;
}

interface BenefitsData {
  imgPos?: "left" | "right";
  title: string;
  desc: string;
  image: {
    src: string;
  } & StaticImageData; // Tailwind-compatible image import
  bullets: BulletItem[];
}

interface BenefitsProps {
  imgPos?: "left" | "right";
  data: BenefitsData;
}

export const Benefits: React.FC<BenefitsProps> = ({ data, imgPos }) => {
  return (
    <Container className="flex flex-wrap mb-20 lg:gap-10 lg:flex-nowrap">
      {/* Image section */}
      <div
        className={`flex items-center justify-center w-full lg:w-1/2 ${
          imgPos === "right" ? "lg:order-1" : ""
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
        className={`flex flex-wrap items-center w-full lg:w-1/2 ${
          imgPos === "right" ? "lg:justify-end" : ""
        }`}
      >
        <div>
          <div className="flex flex-col w-full mt-4">
            <h3 className="max-w-2xl mt-3 text-3xl font-bold leading-snug tracking-tight text-smoky-black lg:leading-tight lg:text-4xl ">
              {data.title}
            </h3>

            <p className="max-w-2xl py-4 text-lg leading-normal text-gray-600 lg:text-xl xl:text-xl ">
              {data.desc}
            </p>
          </div>

          <div className="w-full mt-5">
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
    <div className="flex items-start mt-8 space-x-3">
      <div
        className="flex items-center justify-center flex-shrink-0 mt-1 rounded-md w-11 h-11"
        style={{ backgroundColor: "#9f1315" }}
      >
        {React.cloneElement(icon, {
          className: "w-7 h-7 text-white",
        })}
      </div>
      <div>
        <h4 className="text-xl font-medium text-smoky-black">
          {title}
        </h4>
        <p className="mt-1 text-gray-600 ">{children}</p>
      </div>
    </div>
  );
}
