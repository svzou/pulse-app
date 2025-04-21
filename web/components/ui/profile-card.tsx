// @/components/ui/profile-card.tsx
import React from 'react';

interface UserProfileProps {
  name: string;
  handle: string;
  avatarUrl: string;
  stats: { label: string; value: number }[];
}

const UserProfile: React.FC<UserProfileProps> = ({ name, handle, avatarUrl, stats }) => {
  return (
    <div className="p-4 border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-3">
        <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full" />
        <div>
          <h2 className="text-lg font-semibold">{name}</h2>
          <p className="text-sm text-gray-500">{handle}</p>
        </div>
      </div>
      <div className="flex gap-4 mt-2">
        {stats.map((stat, index) => (
          <div key={index}>
            <span className="font-medium">{stat.value}</span> {stat.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProfile;