"""Emergent-managed Google auth (session cookie) + simple admin key guard."""
import os
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

import jwt
import httpx
from fastapi import APIRouter, HTTPException, Request, Response, Header, Depends
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


ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_JWT_SECRET = os.environ.get("ADMIN_JWT_SECRET") or ADMIN_PASSWORD or "change-me"
ADMIN_TOKEN_HOURS = 12
MAX_ATTEMPTS, LOCK_MINUTES = 5, 15
_attempts: dict = {}  # ip -> {"n": int, "until": datetime}


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return (fwd.split(",")[0].strip() if fwd else request.client.host) or "unknown"


def issue_admin_token() -> tuple[str, str]:
    exp = datetime.now(timezone.utc) + timedelta(hours=ADMIN_TOKEN_HOURS)
    token = jwt.encode({"sub": ADMIN_USERNAME, "role": "admin", "exp": exp, "jti": uuid.uuid4().hex},
                       ADMIN_JWT_SECRET, algorithm="HS256")
    return token, exp.isoformat()


def verify_admin_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, ADMIN_JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Admin session invalid or expired")
    if payload.get("role") != "admin":
        raise HTTPException(401, "Admin session invalid")
    return payload


async def require_admin(request: Request, x_admin_token: str = Header(default="")):
    token = x_admin_token
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Admin authentication required")
    return verify_admin_token(token)


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
    username: str = ""
    password: str


@router.post("/admin-login")
async def admin_login(body: AdminLogin, request: Request):
    ip = _client_ip(request)
    now = datetime.now(timezone.utc)
    rec = _attempts.get(ip)
    if rec and rec.get("until") and rec["until"] > now:
        mins = int((rec["until"] - now).total_seconds() // 60) + 1
        raise HTTPException(429, f"Too many failed attempts. Try again in {mins} min.")
    ok = bool(ADMIN_PASSWORD) and secrets.compare_digest(body.password, ADMIN_PASSWORD) \
        and secrets.compare_digest(body.username.strip().lower(), ADMIN_USERNAME.lower())
    if not ok:
        rec = _attempts.setdefault(ip, {"n": 0, "until": None})
        rec["n"] += 1
        if rec["n"] >= MAX_ATTEMPTS:
            rec["until"] = now + timedelta(minutes=LOCK_MINUTES)
            rec["n"] = 0
        await db.admin_audit.insert_one({"type": "login_failed", "ip": ip, "username": body.username[:50], "at": now.isoformat()})
        raise HTTPException(401, "Invalid username or password")
    _attempts.pop(ip, None)
    token, exp = issue_admin_token()
    await db.admin_audit.insert_one({"type": "login_ok", "ip": ip, "at": now.isoformat()})
    return {"token": token, "expires_at": exp, "username": ADMIN_USERNAME}


@router.get("/admin-me")
async def admin_me(payload: dict = Depends(require_admin)):
    return {"username": payload.get("sub"), "exp": payload.get("exp")}
