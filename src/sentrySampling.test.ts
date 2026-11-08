// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// Sentry 전송량을 줄이기 위해 낮춘 샘플링 설정이 유지되는지 확인한다 (이슈 #718).

const init = vi.hoisted(() => vi.fn());

vi.mock("@sentry/nextjs", () => ({
  init,
  captureRouterTransitionStart: vi.fn(),
  addIntegration: vi.fn(),
  replayIntegration: vi.fn(),
}));

const configs: Array<[string, () => Promise<unknown>]> = [
  ["sentry.server.config", () => import("../sentry.server.config")],
  ["sentry.edge.config", () => import("../sentry.edge.config")],
  ["instrumentation-client", () => import("./instrumentation-client")],
];

describe("Sentry 샘플링 설정", () => {
  beforeEach(() => {
    init.mockClear();
    vi.resetModules();
  });

  it.each(configs)("%s: 트레이스 샘플링 10%, 로그 전송 꺼짐", async (_name, load) => {
    await load();

    expect(init).toHaveBeenCalledTimes(1);
    const options = init.mock.calls[0][0] as { tracesSampleRate: number; enableLogs?: boolean };
    expect(options.tracesSampleRate).toBe(0.1);
    expect(options.enableLogs).not.toBe(true);
  });
});
