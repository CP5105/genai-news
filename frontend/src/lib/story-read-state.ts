export type StoryReadStateEntry = {
  seenLatestTimelineEventAt: string;
};

export type StoryReadState = Record<string, StoryReadStateEntry>;

export const STORY_READ_STATE_STORAGE_KEY = "genai-news:story-read-state";
export const STORY_READ_STATE_CHANGE_EVENT = "genai-news:story-read-state-change";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readStoryReadState(): StoryReadState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORY_READ_STATE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([storyId, entry]) => {
        if (
          isObjectRecord(entry) &&
          typeof entry.seenLatestTimelineEventAt === "string"
        ) {
          return [[storyId, { seenLatestTimelineEventAt: entry.seenLatestTimelineEventAt }]];
        }

        return [];
      }),
    );
  } catch {
    return {};
  }
}

function persistStoryReadState(state: StoryReadState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORY_READ_STATE_STORAGE_KEY,
      JSON.stringify(state),
    );
    window.dispatchEvent(new CustomEvent(STORY_READ_STATE_CHANGE_EVENT));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

export function getStoryReadStateEntry(storyId: string): StoryReadStateEntry | null {
  return readStoryReadState()[storyId] ?? null;
}

export function setStoryReadStateEntry(
  storyId: string,
  entry: StoryReadStateEntry | null,
) {
  const nextState = readStoryReadState();

  if (entry) {
    nextState[storyId] = entry;
  } else {
    delete nextState[storyId];
  }

  persistStoryReadState(nextState);
}
