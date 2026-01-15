import os
import uuid
from typing import List
from google.cloud import firestore
from models import MemoryRecord, MemorySearchRequest

class MemoryStore:
    def __init__(self):
        self.use_firestore = False
        self.db = None
        self._local_storage = {} # Fallback

        try:
            # Check for explicit credentials or implied env
            if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GCLOUD_PROJECT"):
                self.db = firestore.Client()
                self.use_firestore = True
                print("Connected to Firestore.")
            else:
                 print("No Firestore credentials found. Using in-memory fallback.")
        except Exception as e:
            print(f"Firestore init failed ({e}). Using in-memory fallback.")

    def write_memory(self, record: MemoryRecord) -> str:
        if not record.id:
            record.id = str(uuid.uuid4())
        
        if self.use_firestore:
            doc_ref = self.db.collection("memories").document(record.id)
            # Pydantic v2 dump
            doc_ref.set(record.model_dump(mode='json'))
        else:
            self._local_storage[record.id] = record.model_dump(mode='json')
            
        return record.id

    def search_memory(self, params: MemorySearchRequest) -> List[MemoryRecord]:
        limit = params.limit or 10
        
        if self.use_firestore:
            query = self.db.collection("memories")
            if params.type:
                query = query.where(filter=firestore.FieldFilter("type", "==", params.type))
            
            # Firestore doesn't support native full-text search on 'query'. 
            # We will fetch latest N and filter in memory if query is present, 
            # strictly for this prototype. Real app needs vector search.
            query = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
            results = query.stream()
            records = [MemoryRecord(**doc.to_dict()) for doc in results]
            
            if params.query:
                q = params.query.lower()
                filtered = []
                for r in records:
                    # Naive string search in content
                    content_str = str(r.content).lower()
                    if q in content_str:
                        filtered.append(r)
                return filtered
            return records
            
        else:
            # Local fallback search
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
            
            # Sort by date desc
            results.sort(key=lambda x: x.created_at, reverse=True)
            return results[:limit]

    def get_timeline(self, limit: int = 20) -> List[MemoryRecord]:
        if self.use_firestore:
            query = self.db.collection("memories").order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
            return [MemoryRecord(**doc.to_dict()) for doc in query.stream()]
        else:
            results = [MemoryRecord(**doc) for doc in self._local_storage.values()]
            results.sort(key=lambda x: x.created_at, reverse=True)
            return results[:limit]

memory_store = MemoryStore()
