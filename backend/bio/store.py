import os
from typing import Optional
from google.cloud import firestore
from models import UserBio


class UserBioStore:
    def __init__(self):
        self.use_firestore = False
        self.db = None
        self._local_storage = {}

        try:
            if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv(
                "GCLOUD_PROJECT"
            ):
                # Context7: https://github.com/googleapis/python-firestore/blob/main/docs/firestore_v1/client.md
                self.db = firestore.Client()
                self.use_firestore = True
                print("Connected to Firestore.")
            else:
                print("No Firestore credentials found. Using in-memory fallback.")
        except Exception as e:
            print(f"Firestore init failed ({e}). Using in-memory fallback.")

    def get_bio(self, user_id: str) -> Optional[UserBio]:
        if self.use_firestore:
            doc = self.db.collection("user_bios").document(user_id).get()
            if not doc.exists:
                return None
            return UserBio(**doc.to_dict())

        data = self._local_storage.get(user_id)
        if not data:
            return None
        return UserBio(**data)

    def upsert_bio(self, bio: UserBio) -> None:
        payload = bio.model_dump(mode="json")
        if self.use_firestore:
            doc_ref = self.db.collection("user_bios").document(bio.user_id)
            doc_ref.set(payload)
        else:
            self._local_storage[bio.user_id] = payload


bio_store = UserBioStore()
