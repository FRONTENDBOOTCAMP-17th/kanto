import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://50ea2ff041480c74a6089a8c76c58603@o4511624583053312.ingest.us.sentry.io/4511624648130560",
  enabled: process.env.NODE_ENV === "production",

  tracesSampleRate: 1,

  enableLogs: true,

  replaysSessionSampleRate: 0.1,

  replaysOnErrorSampleRate: 1.0,

  sendDefaultPii: true,
});

function lazyLoadReplay() {
  import(/* webpackExports: ["replayIntegration"] */ "@sentry/nextjs")
    .then((mod) => {
      Sentry.addIntegration(mod.replayIntegration());
    })
    .catch(() => {});
}

if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
  const schedule = () =>
    "requestIdleCallback" in window
      ? requestIdleCallback(lazyLoadReplay, { timeout: 5000 })
      : setTimeout(lazyLoadReplay, 3000);

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
