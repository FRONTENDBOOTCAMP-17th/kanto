

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://50ea2ff041480c74a6089a8c76c58603@o4511624583053312.ingest.us.sentry.io/4511624648130560",

  
  integrations: [Sentry.replayIntegration()],

  
  tracesSampleRate: 1,
  
  enableLogs: true,

  
  
  
  replaysSessionSampleRate: 0.1,

  
  replaysOnErrorSampleRate: 1.0,

  
  
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
