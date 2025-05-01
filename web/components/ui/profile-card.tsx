interface UserProfileProps {
  name: string;
  handle: string;
  avatarUrl: string;
  stats: { value: string | number; label: string }[];
}

const UserProfile = ({ name, handle, avatarUrl, stats }: UserProfileProps) => {
  return (
    <div className="p-4 bg-card text-card-foreground border-none shadow-none">
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