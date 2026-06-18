import React from 'react';
import clsx from 'clsx';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const getInitials = (name: string) => {
    return name.charAt(0);
  };

  const getColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center text-white font-medium',
        sizeClasses[size],
        getColor(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
