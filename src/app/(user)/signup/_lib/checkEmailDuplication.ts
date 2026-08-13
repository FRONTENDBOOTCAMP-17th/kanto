export async function checkEmailDuplication(email: string): Promise<boolean> {
  const res = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) return false;

  const { exists } = (await res.json()) as { exists: boolean };
  return exists;
}
