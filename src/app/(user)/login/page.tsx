import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 relative min-h-200 flex flex-col">
        <div className="flex flex-col items-center justify-center flex-1 mb-8 mt-4">
          <Image
            src="/kantoLogo.png"
            alt="Kanto"
            width={200}
            height={94}
            priority
            className="select-none"
          />
        </div>
        <LoginForm />
      </Card>
    </div>
  );
}
