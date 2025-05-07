import Image from "next/image";
import { Container } from "./Container";
import homeheroimage from "../images/homeheroimage.jpg";

export const Hero = () => {
    return (
        <Container className="flex flex-wrap items-center justify-center lg:justify-between px-4 py-8 lg:py-16">
            {/* Left section */}
            <div className="flex flex-col items-center w-full lg:w-1/2 lg:items-start lg:pr-6">
                <h1 className="text-3xl font-bold leading-snug tracking-tight text-center lg:text-left lg:text-4xl xl:text-6xl text-smoky-black"> 
                    Welcome to Empire Football Group!
                </h1>
                <p className="py-5 text-lg leading-relaxed text-gray-600 text-center lg:text-left lg:text-xl xl:text-2xl">
                    Join one of AMSA&apos;s largest football organization having many teams and being a avid member for a long time now!
                    We aspire to be one of Austin&apos;s most exciting and inclusive football communities where our main focus is affordability.
                    Our organization is designed for players of all skills levels who are passionate about the beautiful game.

                </p>
                <div className="flex flex-col items-center w-full gap-4 sm:flex-row lg:justify-start"> 
                    <a
                    //href here
                        rel="noopener"
                        className="px-8 py-4 text-lg text-white font-medium text-center bg-penn-red rounded-md hover:bg-lighter-red"
                    >
                        Learn More
                    </a>
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center justify-center w-full mt-8 lg:w-1/2 lg:mt-0 lg:pl-6">
                <div className="w-full max-w-md lg:max-w-none">
                    <Image
                        src={homeheroimage}
                        width={616}
                        height={617}
                        className="rounded-md object-cover"
                        alt="Picture of some members of the Empire Football Team"
                        loading="eager"
                        placeholder="blur"
                    >
                    </Image>
                </div>
            </div>
        </Container>
    );
};