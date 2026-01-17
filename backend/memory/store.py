"""
Persistent memory storage engine for Biome.

This module provides the MemoryStore class, which acts as the data access
layer for long-term agent reflections. It supports Google Cloud Firestore
for production and an in-memory dictionary for local development/testing.
"""

import os
import uuid
from typing import List
from google.cloud import firestore
from models import MemoryRecord, MemorySearchRequest


class MemoryStore:
    """
    Handles the storage, search, and retrieval of MemoryRecord objects.
    """

    def __init__(self):
        """
        Initializes the storage backend. Checks for Google Cloud credentials
        to determine whether to use Firestore or a local fallback.
        """
        self.use_firestore = False
        self.db = None
        self._local_storage = {}  # In-memory dictionary for fallback.

        try:
            # Check for explicit credentials or project ID in the environment.
            if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv(
                "GCLOUD_PROJECT"
            ):
                self.db = firestore.Client()
                self.use_firestore = True
                print("Connected to Firestore.")
            else:
                print("No Firestore credentials found. Using in-memory fallback.")
        except Exception as e:
            print(f"Firestore init failed ({e}). Using in-memory fallback.")

    def write_memory(self, record: MemoryRecord) -> str:
        """
        Saves a memory record to the active storage backend.

        Args:
            record: The MemoryRecord to persist.

        Returns:
            The ID of the saved record (generated if not provided).
        """
        if not record.id:
            record.id = str(uuid.uuid4())

        if self.use_firestore:
            # Store as a document in the 'memories' collection.
            doc_ref = self.db.collection("memories").document(record.id)
            # Use model_dump(mode="json") for compatibility with Firestore types.
            doc_ref.set(record.model_dump(mode="json"))
        else:
            self._local_storage[record.id] = record.model_dump(mode="json")

        return record.id

    def search_memory(self, params: MemorySearchRequest) -> List[MemoryRecord]:
        """
        Searches for memory records based on type and content keywords.

        Note: This implementation uses a naive in-memory filter for string
        queries since Firestore does not support native full-text search.
        In a production app, this should be replaced with a vector search
        (e.g., Vertex AI Vector Search).

        Args:
            params: A MemorySearchRequest model containing query filters.
        """
        limit = params.limit or 10

        if self.use_firestore:
            query = self.db.collection("memories")
            if params.type:
                query = query.where(
                    filter=firestore.FieldFilter("type", "==", params.type)
                )

            # Retrieve latest N records.
            query = query.order_by(
                "created_at", direction=firestore.Query.DESCENDING
            ).limit(limit)
            results = query.stream()
            records = [MemoryRecord(**doc.to_dict()) for doc in results]

            if params.query:
                # Naive keyword search within the 'content' field.
                q = params.query.lower()
                filtered = []
                for r in records:
                    content_str = str(r.content).lower()
                    if q in content_str:
                        filtered.append(r)
                return filtered
            return records

        else:
            # Search logic for local fallback storage.
            results = []
            for doc in self._local_storage.values():
                if params.type and doc["type"] != params.type:
                    continue

                if params.query:
                    q = params.query.lower()
                    content_str = str(doc["content"]).lower()
                    if q not in content_str:
                        continue

                results.append(MemoryRecord(**doc))

            # Sort by date descending and apply limit.
            results.sort(key=lambda x: x.created_at, reverse=True)
            return results[:limit]

    def get_timeline(self, limit: int = 20) -> List[MemoryRecord]:
        """
        Retrieves a simple chronological timeline of all memory records.

        Args:
            limit: Maximum number of records to return.
        """
        if self.use_firestore:
            query = (
                self.db.collection("memories")
                .order_by("created_at", direction=firestore.Query.DESCENDING)
                .limit(limit)
            )
            return [MemoryRecord(**doc.to_dict()) for doc in query.stream()]
        else:
            # Map local storage to models and sort.
            results = [MemoryRecord(**doc) for doc in self._local_storage.values()]
            results.sort(key=lambda x: x.created_at, reverse=True)
            return results[:limit]


# Singleton instance exported for use in routers and agent tools.
memory_store = MemoryStore()
