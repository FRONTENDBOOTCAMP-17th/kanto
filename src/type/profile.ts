export interface ProfileCardProps {
  user: {
    name: string;
    email: string;
  };
  onBack: () => void;
  onLogout: () => void;
}