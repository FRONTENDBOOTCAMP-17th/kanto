

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://50ea2ff041480c74a6089a8c76c58603@o4511624583053312.ingest.us.sentry.io/4511624648130560",
  enabled: process.env.NODE_ENV === "production",

  // Session Replay는 초기 공통 번들에서 제외하고 아래에서 지연 로딩(Sentry CDN)


  tracesSampleRate: 1,

  enableLogs: true,




  replaysSessionSampleRate: 0.1,


  replaysOnErrorSampleRate: 1.0,



  sendDefaultPii: true,
});

// 초기 렌더 이후 유휴 시점에 Session Replay 통합을 지연 로딩해 초기 JS를 줄인다.
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  const loadReplay = async () => {
    try {
      const replayIntegration = await Sentry.lazyLoadIntegration("replayIntegration");
      Sentry.addIntegration(replayIntegration());
    } catch {
      // CDN 로드 실패 시 Replay 없이 계속 동작
    }
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => loadReplay());
  } else {
    setTimeout(loadReplay, 2000);
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
