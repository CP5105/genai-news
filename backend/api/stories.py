from typing import Annotated
import re
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pymongo import DESCENDING

from db.mongo import MONGO_COLLECTION, MONGO_DATABASE, mongo_client
from schemas.story import StoryDetail, StoriesResponse

router = APIRouter()

PAGE_SIZE = 10


@router.get("/stories", response_model=StoriesResponse)
def get_stories(
    page: Annotated[int, Query(ge=1)] = 1,
    collections: Annotated[list[str], Query()] = None,
    search: Annotated[str, Query()] = None,
):
    if not mongo_client or not MONGO_DATABASE or not MONGO_COLLECTION:
        return {
            "items": [],
            "pagination": {
                "page": page,
                "page_size": PAGE_SIZE,
                "total": 0,
                "has_next": False,
            },
        }

    assert MONGO_DATABASE is not None
    assert MONGO_COLLECTION is not None
    skip = (page - 1) * PAGE_SIZE
    collection = mongo_client[MONGO_DATABASE][MONGO_COLLECTION]
    query = {"is_active": True, "is_visible": True}

    if collections:
        query["ref_articles.collection"] = {"$in": collections}

    if search:
        escaped_search = re.escape(search)
        query["$or"] = [
            {"headline": {"$regex": f"\\b{escaped_search}\\b", "$options": "i"}},
            {"timeline.summary": {"$regex": f"\\b{escaped_search}\\b", "$options": "i"}},
        ]

    total = collection.count_documents(query)
    cursor = (
        collection.find(
            query,
            {
                "_id": 1,
                "headline": 1,
                "latest_ref_article_at": 1,
                "cover_images": {"$slice": 5},
            },
        )
        .sort("latest_ref_article_at", DESCENDING)
        .skip(skip)
        .limit(PAGE_SIZE)
    )

    items = [
        {
            "id": str(doc.get("_id")),
            "headline": doc.get("headline"),
            "latest_ref_article_at": doc.get("latest_ref_article_at"),
            "cover_images": doc.get("cover_images"),
        }
        for doc in cursor
    ]

    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": PAGE_SIZE,
            "total": total,
            "has_next": skip + PAGE_SIZE < total,
        },
    }


@router.get("/story/{story_id}", response_model=StoryDetail)
def get_story_detail(story_id: str):
    if not mongo_client or not MONGO_DATABASE or not MONGO_COLLECTION:
        raise HTTPException(status_code=500, detail="Database not configured")

    assert MONGO_DATABASE is not None
    assert MONGO_COLLECTION is not None

    collection = mongo_client[MONGO_DATABASE][MONGO_COLLECTION]
    doc = collection.find_one(
        {"_id": ObjectId(story_id), "is_active": True, "is_visible": True},
        {
            "_id": 1,
            "headline": 1,
            "timeline.type": 1,
            "timeline.created_at": 1,
            "timeline.event_at": 1,
            "timeline.summary": 1,
            "latest_ref_article_at": 1,
            "cover_images": {"$slice": 5},
            "ref_articles.article_id": 1,
            "ref_articles.url": 1,
            "ref_articles.title": 1,
            "ref_articles.update_date": 1,
            "ref_articles.source": 1,
        },
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Story not found")

    return {
        "id": str(doc.get("_id")),
        "headline": doc.get("headline"),
        "timeline": doc.get("timeline", []),
        "cover_images": doc.get("cover_images", []),
        "latest_ref_article_at": doc.get("latest_ref_article_at"),
        "ref_articles": doc.get("ref_articles", [])[:5],
    }
