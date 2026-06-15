import { Card } from "@/components/ui/card";
import Image from "next/image";
import LoginForm from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 relative min-h-200 flex flex-col">
        <div className="flex flex-col items-center justify-center flex-1 mb-8 mt-4">
          <Image
            src="/logoIcon+Text.png"
            alt="Kanto"
            width={80}
            height={80}
            className="h-20 w-auto"
          />
        </div>
        <LoginForm />
      </Card>
    </div>
  );
}
