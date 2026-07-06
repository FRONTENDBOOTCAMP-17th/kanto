"use client";

import { useCallback, useEffect, useState } from "react";

export const SIGNUP_TERM_TYPES = ["terms", "privacy", "age"] as const;

export type ModalType = (typeof SIGNUP_TERM_TYPES)[number];
export type TermsLoadStatus = "loading" | "success" | "error";

export interface TermsResource {
  status: TermsLoadStatus;
  content: string | null;
}

type TermsResources = Record<ModalType, TermsResource>;
type TermsResponse = { content: string };

const LOADING_RESOURCES: TermsResources = {
  terms: { status: "loading", content: null },
  privacy: { status: "loading", content: null },
  age: { status: "loading", content: null },
};

const inFlight = new Map<string, Promise<TermsResponse>>();

function fetchTerms(type: ModalType, locale: string) {
  const key = `${locale}:${type}`;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = fetch(
    `/api/terms?type=${type}&locale=${encodeURIComponent(locale)}`,
  )
    .then(async (response) => {
      if (!response.ok) throw new Error(`Terms request failed: ${response.status}`);

      const data: unknown = await response.json();
      if (
        !data ||
        typeof data !== "object" ||
        !("content" in data) ||
        typeof data.content !== "string"
      ) {
        throw new Error("Invalid terms response");
      }

      return { content: data.content };
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

export function useSignupTerms(locale: string) {
  const [resourcesByLocale, setResourcesByLocale] = useState<
    Record<string, TermsResources>
  >({});

  const load = useCallback((type: ModalType, targetLocale: string) => {
    setResourcesByLocale((previous) => ({
      ...previous,
      [targetLocale]: {
        ...(previous[targetLocale] ?? LOADING_RESOURCES),
        [type]: { status: "loading", content: null },
      },
    }));

    return fetchTerms(type, targetLocale).then(
      ({ content }) => {
        setResourcesByLocale((previous) => ({
          ...previous,
          [targetLocale]: {
            ...(previous[targetLocale] ?? LOADING_RESOURCES),
            [type]: { status: "success", content },
          },
        }));
      },
      () => {
        setResourcesByLocale((previous) => ({
          ...previous,
          [targetLocale]: {
            ...(previous[targetLocale] ?? LOADING_RESOURCES),
            [type]: { status: "error", content: null },
          },
        }));
      },
    );
  }, []);

  useEffect(() => {
    // Each request settles independently so one unavailable page does not block
    // the other agreement modals.
    SIGNUP_TERM_TYPES.forEach((type) => void load(type, locale));
  }, [load, locale]);

  const retry = useCallback(
    (type: ModalType) => {
      void load(type, locale);
    },
    [load, locale],
  );

  return {
    resources: resourcesByLocale[locale] ?? LOADING_RESOURCES,
    retry,
  };
}
