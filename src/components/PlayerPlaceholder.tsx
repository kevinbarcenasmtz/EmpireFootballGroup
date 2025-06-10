import React from 'react';

interface PlayerPlaceholderProps {
  name: string;
  number?: number;
  teamColor?: string;
}

export const PlayerPlaceholder: React.FC<PlayerPlaceholderProps> = ({
  name,
  number,
  teamColor = 'penn-red',
}) => {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`bg-${teamColor} flex h-full w-full items-center justify-center text-white`}>
      <div className="text-center">
        {number && <div className="text-lg font-bold opacity-75">#{number}</div>}
        <div className="text-2xl font-bold">{initials}</div>
      </div>
    </div>
  );
};
