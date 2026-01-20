"""
Profile storage engine for Biome.

Provides a simple persistence layer with local JSON fallback and optional Firestore support.
"""

import json
import os
from typing import Dict, Optional

from google.cloud import firestore

from models import UserProfile

# Ensure paths are relative to the backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PROFILE_FILE = os.path.join(DATA_DIR, "user_profile.json")

class ProfileStore:
    """
    Persists user profile records with a JSON file fallback and optional Firestore backend.
    """

    def __init__(self):
        self.use_firestore = False
        self.db = None
        self._local_profiles: Dict[str, Dict] = {}
        
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)

        self._load_local_from_disk()

        try:
            project_id = os.getenv("GCLOUD_PROJECT")
            db_id = os.getenv("FIRESTORE_DATABASE_ID", "(default)")
            if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or project_id:
                self.db = firestore.Client(project=project_id, database=db_id)
                self.use_firestore = True
                print(f"Connected to Firestore for profiles (db: {db_id}).")
            else:
                print("No Firestore credentials found. Using local JSON profile store.")
        except Exception as exc:
            print(f"Firestore init failed ({exc}). Using local JSON profile store.")

    def _load_local_from_disk(self):
        """Loads profiles from the local JSON file if it exists."""
        if os.path.exists(PROFILE_FILE):
            try:
                with open(PROFILE_FILE, "r") as f:
                    self._local_profiles = json.load(f)
            except Exception as e:
                print(f"Error loading local profile file: {e}")
                self._local_profiles = {}

    def _save_local_to_disk(self):
        """Saves current local profiles to the JSON file."""
        try:
            with open(PROFILE_FILE, "w") as f:
                json.dump(self._local_profiles, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving profile to disk: {e}")

    def get_profile(self, user_id: str) -> Optional[UserProfile]:
        """
        Retrieves a profile by user_id.
        """
        if self.use_firestore:
            try:
                doc = self.db.collection("profiles").document(user_id).get()
                if doc.exists:
                    return UserProfile(**doc.to_dict())
            except Exception as e:
                print(f"Firestore read error: {e}")

        data = self._local_profiles.get(user_id)
        return UserProfile(**data) if data else None

    def upsert_profile(self, profile: UserProfile) -> UserProfile:
        """
        Inserts or updates a profile record.
        """
        payload = profile.model_dump(mode="json")

        if self.use_firestore:
            try:
                self.db.collection("profiles").document(profile.user_id).set(payload)
            except Exception as e:
                print(f"Firestore write error: {e}")

        # Always update local cache and disk for persistence in prototype
        self._local_profiles[profile.user_id] = payload
        self._save_local_to_disk()

        return profile

    def clear_local(self):
        """
        Clears the in-memory store and deletes the local file (test helper).
        """
        self._local_profiles.clear()
        if os.path.exists(PROFILE_FILE):
            os.remove(PROFILE_FILE)


profile_store = ProfileStore()
