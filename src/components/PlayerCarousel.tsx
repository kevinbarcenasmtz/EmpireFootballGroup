'use client';
import React, { useState, useEffect } from 'react';
import Image, { StaticImageData } from 'next/image';
import { EmblaOptionsType } from 'embla-carousel';
import { DotButton, useDotButton } from './EmblaCarouselDotButton';
import { PrevButton, NextButton, usePrevNextButtons } from './EmblaCarouselArrowButtons';
import useEmblaCarousel from 'embla-carousel-react';

export type Player = {
  name: string;
  position: string;
  image: StaticImageData;
  number?: number;
  bio?: string;
};

type PropType = {
  players: Player[];
  options?: EmblaOptionsType;
  teamColor?: string;
};

const PlayerCarousel: React.FC<PropType> = props => {
  const { players, options, teamColor = 'penn-red' } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [isMobile, setIsMobile] = useState(false);

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);

  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    usePrevNextButtons(emblaApi);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 750);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="embla-players">
      <div className="embla-players__viewport" ref={emblaRef}>
        <div className="embla-players__container">
          {players.map((player, index) => (
            <div className="embla-players__slide" key={index}>
              <div className="player-card">
                <div className="player-card__image">
                  <Image
                    src={player.image}
                    alt={
                      player.name ? `${player.name} - ${player.position}` : `Player ${index + 1}`
                    }
                    fill
                    sizes="(max-width: 750px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    className="rounded-lg"
                  />{' '}
                  {player.number && (
                    <div className={`player-card__number bg-${teamColor}`}>#{player.number}</div>
                  )}
                </div>
                {(player.name || player.position || player.bio) && (
                  <div className="player-card__content">
                    {player.name && <h3 className="player-card__name">{player.name}</h3>}
                    {player.position && (
                      <p className={`player-card__position text-${teamColor}`}>{player.position}</p>
                    )}
                    {player.bio && <p className="player-card__bio">{player.bio}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="embla-players__controls">
        <div className="embla-players__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>

        {/* Only show dots on tablet and desktop */}
        {!isMobile && (
          <div className="embla-players__dots">
            {scrollSnaps.map((_, index) => (
              <DotButton
                key={index}
                onClick={() => onDotButtonClick(index)}
                className={`embla-players__dot${
                  index === selectedIndex ? 'embla-players__dot--selected' : ''
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PlayerCarousel;
