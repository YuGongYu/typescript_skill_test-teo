// lib/i18n.ts
import type { Question } from "../models";

const FALLBACK: Record<string, string> = {
  "Strategian selkeys": "Credibility of the strategy",
  "Johdon luotettavuus": "Reliability of management",
  "Lähivuosien tuloskasvunäkymät": "Short-term profit growth",
  "Kilpailuetujen vahvuus": "Competitive advantages",
  "Pitkän aikavälin houkuttelevuus": "Long-term attractiveness",
};

export function questionLabel(q: Question) {
  const t =
    (q.translations && q.translations.en?.shortText) ||
    FALLBACK[q.shortText] ||
    q.shortText;
  return t;
}
