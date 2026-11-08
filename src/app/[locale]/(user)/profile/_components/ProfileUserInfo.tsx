"use client";

export function ProfileUserInfo({ name, email }: { name: string; email: string }) {
  return (
    <div className="text-center">
      <p className="font-semibold text-gray-900">{name}</p>
      <p className="text-sm text-gray-400 mt-0.5">{email}</p>
    </div>
  );
}
