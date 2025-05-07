import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: Readonly<ContainerProps>) {
  return (
    <div className={`w-full max-w-screen-xl p-6 md:p-12 lg:p-16 mx-auto ${className ?? ""}`}>
      {children}
    </div>
  );
}
