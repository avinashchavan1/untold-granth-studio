// The channel this copy of the studio serves (repo root channel.json; one channel per copy of the template).
import channel from "../../channel.json";
export const CHANNEL = channel;
export const SERIES_ID = channel.series.id;
export const IG = channel.handles.instagram;
export const YT = channel.handles.youtube;
// Words that depend on the kind of channel: a single base text cites verses; a facts channel (no source.verse_url) cites sources.
export const FACTS = !(channel.source as { verse_url?: string }).verse_url;
export const W = FACTS
  ? { ref: "Source", refs: "sources", against: "against its source", text: "the sources", where: "Category / source", wherePh: "e.g. Science · NASA", idea: "a fact to check, a myth to bust, a source, a hook", needRef: "Every factual claim needs a source link before the reel can be scripted.", opening: "Opening fact" }
  : { ref: "Verse", refs: "verses", against: "against its verse", text: "the text", where: "Where in the text", wherePh: "e.g. Sundara · 36", idea: "a myth to check, a verse, a character, a hook", needRef: "Every factual claim needs a verse reference before the reel can be scripted.", opening: `Opening śloka · ${channel.series.book}` };
