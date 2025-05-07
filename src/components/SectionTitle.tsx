import React from "react";
import { Container } from "./Container";

interface SectionTitleProps {
    preTitle?: string,
    title?: string,
    align?: "left" | "center",
    children?: React.ReactNode
}

export const SectionTitle = (props: Readonly<SectionTitleProps>) => {
    return (
        <Container
            className={`flex w-full flex-col mt-4 ${
                props.align === "left" ? "" : "items-center justify-center text-center"
            }`}>
            {props.preTitle && (
                <div className="text-sm font-bold tracking-wider text-penn-red uppercase">
                {props.preTitle}
                </div>
            )}

            {props.title && (
                <h2 className="max-w-2xl mt-3 text-3xl font-bold leading-snug tracking-tight text-smoky-black lg:leading-tight lg:text-4xl">
                {props.title}
                </h2>
            )}

            {props.children && (
                <p className="max-w-2xl py-4 text-lg leading-norma lg:text-xl xl:text-xl ">
                {props.children}
                </p>
            )}
        </Container>
    )
};