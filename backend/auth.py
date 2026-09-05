"""Emergent-managed Google auth (session cookie) + simple admin key guard."""
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request, Response, Header
from pydantic import BaseModel
from db import db

router = APIRouter(prefix="/api/auth")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
SESSION_DAYS = 7


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None


def _aware(dt):
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


async def get_current_user(request: Request) -> User:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(401, "Invalid session")
    if _aware(sess["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired")
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return User(**user)


async def optional_user(request: Request) -> Optional[User]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def require_admin(x_admin_key: str = Header(default="")):
    if not ADMIN_PASSWORD or x_admin_key != ADMIN_PASSWORD:
        raise HTTPException(401, "Admin key invalid")


class SessionIn(BaseModel):
    session_id: str


@router.post("/session")
async def create_session(body: SessionIn, response: Response):
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                        headers={"X-Session-ID": body.session_id})
    if r.is_error:
        raise HTTPException(401, "Invalid session id")
    d = r.json()
    now = datetime.now(timezone.utc)
    user = await db.users.find_one({"email": d["email"]}, {"_id": 0})
    if user:
        await db.users.update_one({"user_id": user["user_id"]},
                                  {"$set": {"name": d.get("name") or user["name"], "picture": d.get("picture")}})
        user_id = user["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": d["email"], "name": d.get("name") or d["email"],
                                   "picture": d.get("picture"), "created_at": now.isoformat()})
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": d["session_token"],
                                       "expires_at": (now + timedelta(days=SESSION_DAYS)).isoformat(),
                                       "created_at": now.isoformat()})
    response.set_cookie("session_token", d["session_token"], httponly=True, secure=True, samesite="none",
                        path="/", max_age=SESSION_DAYS * 24 * 3600)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return User(**user)


@router.get("/me")
async def me(request: Request):
    return await get_current_user(request)


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"ok": True}


class AdminLogin(BaseModel):
    password: str


@router.post("/admin-login")
async def admin_login(body: AdminLogin):
    if not ADMIN_PASSWORD or body.password != ADMIN_PASSWORD:
        raise HTTPException(401, "Wrong password")
    return {"ok": True}
