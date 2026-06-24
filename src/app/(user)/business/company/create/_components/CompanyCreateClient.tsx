"use client";

import { useRouter } from "next/navigation";
import { CompanyForm } from "../../../_components/CompanyForm";
import type { Company } from "@/type/company";

export function CompanyCreateClient({ userId }: { userId: number }) {
  const router = useRouter();

  const handleSuccess = (_: Company) => {
    router.push("/business/dashboard");
  };

  const handleCancel = () => {
    router.push("/business");
  };

  return (
    <CompanyForm
      userId={userId}
      initialData={null}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
