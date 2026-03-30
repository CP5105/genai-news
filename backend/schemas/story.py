from datetime import datetime

from pydantic import BaseModel


class StoryItem(BaseModel):
    id: str
    headline: str
    latest_timeline_event_at: datetime
    has_follow_up: bool
    cover_images: list[str]


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int
    has_next: bool


class StoriesResponse(BaseModel):
    items: list[StoryItem]
    pagination: Pagination


class RefArticle(BaseModel):
    article_id: str
    url: str
    title: str
    update_date: datetime
    source: str


class StoryTimelineEntry(BaseModel):
    type: str
    created_at: datetime
    event_at: datetime
    summary: list[str]


class StoryDetail(BaseModel):
    id: str
    headline: str
    timeline: list[StoryTimelineEntry]
    cover_images: list[str]
    latest_timeline_event_at: datetime
    ref_articles: list[RefArticle]
