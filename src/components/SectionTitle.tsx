import React from 'react';
import { Container } from './Container';

interface SectionTitleProps {
  preTitle?: string;
  title?: string;
  align?: 'left' | 'center';
  children?: React.ReactNode;
}

export const SectionTitle = (props: Readonly<SectionTitleProps>) => {
  return (
    <Container
      className={`mt-4 flex w-full flex-col ${
        props.align === 'left' ? '' : 'items-center justify-center text-center'
      }`}
    >
      {props.preTitle && (
        <div className="text-penn-red text-sm font-bold tracking-wider uppercase">
          {props.preTitle}
        </div>
      )}

      {props.title && (
        <h2 className="text-text-primary mt-3 max-w-2xl text-3xl leading-snug font-bold tracking-tight lg:text-4xl lg:leading-tight">
          {props.title}
        </h2>
      )}

      {props.children && (
        <p className="max-w-2xl py-4 text-lg leading-normal lg:text-xl xl:text-xl">
          {props.children}
        </p>
      )}
    </Container>
  );
};
