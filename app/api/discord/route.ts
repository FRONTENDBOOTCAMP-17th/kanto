// app/api/discord/route.ts
export async function GET() {
  await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "✅ Kanto 디스코드 연결 성공!",
    }),
  });

  return Response.json({ ok: true });
}
