from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'omnihub_secret_key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 1440))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="OmniHub API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    credits: int
    is_active: bool
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CreditUpdate(BaseModel):
    user_id: str
    amount: int
    reason: str

class UsageLogResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    tool: str
    credits_used: int
    status: str
    details: Optional[str] = None
    created_at: str

class CreditLogResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    amount: int
    balance_after: int
    reason: str
    admin_id: str
    created_at: str

# Tool request models
class PhoneLookupRequest(BaseModel):
    phone: str

class EyeconLookupRequest(BaseModel):
    phone: str

class TempEmailRequest(BaseModel):
    action: str = "generate"
    email: Optional[str] = None

class YouTubeRequest(BaseModel):
    url: str

class ImageEnhanceRequest(BaseModel):
    image_url: str

class TamashaOTPRequest(BaseModel):
    phone: str
    action: str = "send"
    otp: Optional[str] = None

# Credit costs
CREDIT_COSTS = {
    "live_tv": 1,
    "tamasha_otp": 2,
    "temp_email": 1,
    "youtube_download": 3,
    "image_enhance": 2,
    "phone_lookup": 1,
    "eyecon_lookup": 1
}

# ============== HELPERS ==============

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="User suspended")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def check_credits(user: dict, tool: str):
    cost = CREDIT_COSTS.get(tool, 1)
    if user.get("credits", 0) < cost:
        raise HTTPException(status_code=402, detail=f"Insufficient credits. Required: {cost}, Available: {user.get('credits', 0)}")
    return cost

async def deduct_credits(user_id: str, tool: str, cost: int, status_str: str = "success", details: str = None):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    new_balance = user.get("credits", 0) - cost
    await db.users.update_one({"id": user_id}, {"$set": {"credits": new_balance}})
    
    # Log usage
    usage_log = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_email": user.get("email"),
        "tool": tool,
        "credits_used": cost,
        "status": status_str,
        "details": details,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.usage_logs.insert_one(usage_log)
    return new_balance

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": get_password_hash(user_data.password),
        "role": "user",
        "credits": 0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    access_token = create_access_token(data={"sub": user_id, "role": "user"})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            email=user["email"],
            name=user["name"],
            role=user["role"],
            credits=user["credits"],
            is_active=user["is_active"],
            created_at=user["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account suspended")
    
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            credits=user["credits"],
            is_active=user["is_active"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        credits=user["credits"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.post("/admin/credits")
async def update_credits(data: CreditUpdate, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_balance = user.get("credits", 0) + data.amount
    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Cannot reduce credits below 0")
    
    await db.users.update_one({"id": data.user_id}, {"$set": {"credits": new_balance}})
    
    # Log credit change
    credit_log = {
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "user_email": user.get("email"),
        "amount": data.amount,
        "balance_after": new_balance,
        "reason": data.reason,
        "admin_id": admin["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.credit_logs.insert_one(credit_log)
    
    return {"message": "Credits updated", "new_balance": new_balance}

@api_router.post("/admin/users/{user_id}/suspend")
async def suspend_user(user_id: str, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot suspend admin")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": new_status}})
    return {"message": f"User {'unsuspended' if new_status else 'suspended'}", "is_active": new_status}

@api_router.get("/admin/usage-logs", response_model=List[UsageLogResponse])
async def get_usage_logs(admin: dict = Depends(require_admin), limit: int = Query(100, le=1000)):
    logs = await db.usage_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return logs

@api_router.get("/admin/credit-logs", response_model=List[CreditLogResponse])
async def get_credit_logs(admin: dict = Depends(require_admin), limit: int = Query(100, le=1000)):
    logs = await db.credit_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return logs

# ============== TOOL ROUTES ==============

@api_router.post("/tools/phone-lookup")
async def phone_lookup(data: PhoneLookupRequest, user: dict = Depends(get_current_user)):
    cost = await check_credits(user, "phone_lookup")
    
    # Sanitize phone number - remove all non-numeric characters
    import re
    sanitized_phone = re.sub(r'\D', '', data.phone)
    
    # Ensure proper format (add 92 prefix if starts with 0)
    if sanitized_phone.startswith('0'):
        sanitized_phone = '92' + sanitized_phone[1:]
    
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(
                f"https://sychosimdatabase.vercel.app/api/lookup?query={sanitized_phone}",
                timeout=30.0
            )
            api_response = response.json()
        
        await deduct_credits(user["id"], "phone_lookup", cost, "success", sanitized_phone)
        
        # Return the exact API response structure
        return {
            "success": api_response.get("success", False),
            "results_count": api_response.get("results_count", 0),
            "results": api_response.get("results", []),
            "query": sanitized_phone,
            "credits_used": cost
        }
    except Exception as e:
        await deduct_credits(user["id"], "phone_lookup", cost, "failed", str(e))
        return {
            "success": False,
            "results_count": 0,
            "results": [],
            "query": sanitized_phone,
            "error": str(e),
            "credits_used": cost
        }

@api_router.post("/tools/eyecon-lookup")
async def eyecon_lookup(data: EyeconLookupRequest, user: dict = Depends(get_current_user)):
    cost = await check_credits(user, "eyecon_lookup")
    
    # Sanitize phone number - remove all non-numeric characters
    import re
    sanitized_phone = re.sub(r'\D', '', data.phone)
    
    # Ensure proper format (add 92 prefix if starts with 0)
    if sanitized_phone.startswith('0'):
        sanitized_phone = '92' + sanitized_phone[1:]
    
    logger.info(f"Eyecon lookup initiated for: {sanitized_phone}")
    
    # Get Eyecon credentials from env
    e_auth_v = os.environ.get("EYECON_E_AUTH_V", "")
    e_auth = os.environ.get("EYECON_E_AUTH", "")
    e_auth_c = os.environ.get("EYECON_E_AUTH_C", "")
    e_auth_k = os.environ.get("EYECON_E_AUTH_K", "")
    
    # Check if headers are configured
    headers_configured = all([
        e_auth_v and e_auth_v != "REPLACE_ME",
        e_auth and e_auth != "REPLACE_ME",
        e_auth_c and e_auth_c != "REPLACE_ME",
        e_auth_k and e_auth_k != "REPLACE_ME"
    ])
    
    logger.info(f"Eyecon headers configured: {headers_configured}")
    
    # Build headers
    headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "accept": "application/json",
        "accept-charset": "UTF-8",
        "content-type": "application/x-www-form-urlencoded",
        "Host": "api.eyecon-app.com",
        "Connection": "Keep-Alive"
    }
    
    # Add auth headers only if configured
    if headers_configured:
        headers["e-auth-v"] = e_auth_v
        headers["e-auth"] = e_auth
        headers["e-auth-c"] = e_auth_c
        headers["e-auth-k"] = e_auth_k
    
    # Build query params
    params = {
        "cli": sanitized_phone,
        "lang": "en",
        "is_callerid": "true",
        "is_ic": "true",
        "cv": "vc_672_vn_4.2025.10.17.1932_a",
        "requestApi": "URLconnection",
        "source": "MenifaFragment"
    }
    
    try:
        async with httpx.AsyncClient() as client_http:
            logger.info(f"Eyecon request sending to API...")
            response = await client_http.get(
                "https://api.eyecon-app.com/app/getnames.jsp",
                headers=headers,
                params=params,
                timeout=30.0
            )
            
            status_code = response.status_code
            logger.info(f"Eyecon response received → status {status_code}")
            
            # Parse response
            response_text = response.text
            logger.info(f"Eyecon response body length: {len(response_text)} chars")
            
            # Try to parse as JSON
            try:
                result_data = response.json()
                logger.info(f"Eyecon response parsed as JSON successfully")
            except Exception as json_err:
                logger.warning(f"Eyecon response not JSON: {str(json_err)}")
                result_data = None
            
            # Handle different status codes
            if status_code == 200 and result_data:
                # Success - extract names
                names = []
                if isinstance(result_data, list):
                    names = result_data
                elif isinstance(result_data, dict):
                    names = result_data.get("names", result_data.get("results", []))
                    if not names and "name" in result_data:
                        names = [{"name": result_data["name"]}]
                
                await deduct_credits(user["id"], "eyecon_lookup", cost, "success", sanitized_phone)
                return {
                    "success": True,
                    "mode": "live",
                    "query": sanitized_phone,
                    "status_code": status_code,
                    "names": names if isinstance(names, list) else [names],
                    "raw_data": result_data,
                    "credits_used": cost,
                    "headers_configured": headers_configured
                }
            
            elif status_code in [401, 403]:
                # Auth failed - return safe mode
                logger.warning(f"Eyecon auth failed with status {status_code}")
                await deduct_credits(user["id"], "eyecon_lookup", cost, "auth_failed", sanitized_phone)
                return {
                    "success": True,
                    "mode": "safe",
                    "query": sanitized_phone,
                    "status_code": status_code,
                    "names": [],
                    "message": "Eyecon authentication failed - headers may be invalid or expired",
                    "credits_used": cost,
                    "headers_configured": headers_configured
                }
            
            else:
                # Other status - return what we got
                logger.warning(f"Eyecon returned status {status_code}")
                await deduct_credits(user["id"], "eyecon_lookup", cost, f"status_{status_code}", sanitized_phone)
                return {
                    "success": True,
                    "mode": "safe",
                    "query": sanitized_phone,
                    "status_code": status_code,
                    "names": [],
                    "raw_response": response_text[:500] if response_text else "",
                    "message": f"Eyecon returned status {status_code}",
                    "credits_used": cost,
                    "headers_configured": headers_configured
                }
                
    except httpx.TimeoutException:
        logger.error(f"Eyecon request timed out for {sanitized_phone}")
        await deduct_credits(user["id"], "eyecon_lookup", cost, "timeout", sanitized_phone)
        return {
            "success": True,
            "mode": "safe",
            "query": sanitized_phone,
            "names": [],
            "message": "Eyecon request timed out",
            "credits_used": cost,
            "headers_configured": headers_configured
        }
        
    except Exception as e:
        logger.error(f"Eyecon request failed: {str(e)}")
        await deduct_credits(user["id"], "eyecon_lookup", cost, "error", str(e))
        return {
            "success": True,
            "mode": "safe",
            "query": sanitized_phone,
            "names": [],
            "message": f"Eyecon unavailable: {str(e)}",
            "error": str(e),
            "credits_used": cost,
            "headers_configured": headers_configured
        }

@api_router.post("/tools/temp-email")
async def temp_email(data: TempEmailRequest, user: dict = Depends(get_current_user)):
    cost = await check_credits(user, "temp_email")
    
    try:
        async with httpx.AsyncClient() as client_http:
            if data.action == "generate":
                # Generate new temp email using guerrillamail API as fallback
                try:
                    response = await client_http.get(
                        "https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1",
                        timeout=10.0
                    )
                    if response.status_code == 200:
                        try:
                            emails = response.json()
                            email = emails[0] if emails else None
                        except:
                            email = None
                    else:
                        email = None
                except:
                    email = None
                
                # Fallback to generating local temp email
                if not email:
                    import random
                    import string
                    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
                    email = f"{random_str}@1secmail.com"
                
                await deduct_credits(user["id"], "temp_email", cost, "success", "generated")
                return {"success": True, "email": email, "credits_used": cost}
            elif data.action == "check" and data.email:
                # Check inbox
                try:
                    login, domain = data.email.split("@")
                    response = await client_http.get(
                        f"https://www.1secmail.com/api/v1/?action=getMessages&login={login}&domain={domain}",
                        timeout=10.0
                    )
                    if response.status_code == 200:
                        try:
                            messages = response.json()
                        except:
                            messages = []
                    else:
                        messages = []
                except:
                    messages = []
                return {"success": True, "messages": messages, "credits_used": 0}  # Checking is free
            else:
                raise HTTPException(status_code=400, detail="Invalid action")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Temp email error: {str(e)}")

@api_router.post("/tools/youtube-download")
async def youtube_download(data: YouTubeRequest, user: dict = Depends(get_current_user)):
    cost = await check_credits(user, "youtube_download")
    
    try:
        # Using a free YouTube info API
        video_id = None
        if "youtube.com" in data.url:
            video_id = data.url.split("v=")[1].split("&")[0] if "v=" in data.url else None
        elif "youtu.be" in data.url:
            video_id = data.url.split("/")[-1].split("?")[0]
        
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        # Get video info using noembed
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(
                f"https://noembed.com/embed?url=https://www.youtube.com/watch?v={video_id}",
                timeout=30.0
            )
            video_info = response.json()
        
        await deduct_credits(user["id"], "youtube_download", cost, "success", video_id)
        
        return {
            "success": True,
            "video_id": video_id,
            "title": video_info.get("title", "Unknown"),
            "author": video_info.get("author_name", "Unknown"),
            "thumbnail": video_info.get("thumbnail_url", f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"),
            "download_links": [
                {"quality": "720p", "url": f"https://ssyoutube.com/watch?v={video_id}"},
                {"quality": "360p", "url": f"https://ssyoutube.com/watch?v={video_id}"}
            ],
            "credits_used": cost
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube download error: {str(e)}")

@api_router.post("/tools/image-enhance")
async def image_enhance(data: ImageEnhanceRequest, user: dict = Depends(get_current_user)):
    cost = await check_credits(user, "image_enhance")
    
    try:
        # Using free image upscaling API placeholder
        # In production, integrate with real image enhancement service
        await deduct_credits(user["id"], "image_enhance", cost, "success", data.image_url)
        
        return {
            "success": True,
            "original_url": data.image_url,
            "enhanced_url": data.image_url,  # Placeholder - integrate real service
            "message": "Image enhancement service ready. Configure external API for full functionality.",
            "credits_used": cost
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image enhance error: {str(e)}")

# Jazz TV / Tamasha Channel Data
JAZZTV_CHANNELS = [
    # News Channels
    {
        "id": "geo_news",
        "name": "Geo News",
        "logo": "https://jazztv.com.pk/images/channels/geo-news.webp",
        "stream_url": "https://jfrsgeo.cdn.jfrstvdemo.com/geonews/jfrstv_geo_news_720p/playlist.m3u8",
        "category": "News",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "ary_news",
        "name": "ARY News",
        "logo": "https://jazztv.com.pk/images/channels/ary-news.webp",
        "stream_url": "https://jfrsary.cdn.jfrstvdemo.com/arynews/jfrstv_ary_news_720p/playlist.m3u8",
        "category": "News",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "express_news",
        "name": "Express News",
        "logo": "https://jazztv.com.pk/images/channels/express-news.webp",
        "stream_url": "https://jfrsexp.cdn.jfrstvdemo.com/expressnews/jfrstv_express_news_720p/playlist.m3u8",
        "category": "News",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "samaa_tv",
        "name": "Samaa TV",
        "logo": "https://jazztv.com.pk/images/channels/samaa.webp",
        "stream_url": "https://jfrssamaa.cdn.jfrstvdemo.com/samaa/jfrstv_samaa_720p/playlist.m3u8",
        "category": "News",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "dunya_news",
        "name": "Dunya News",
        "logo": "https://jazztv.com.pk/images/channels/dunya-news.webp",
        "stream_url": "https://jfrsdunya.cdn.jfrstvdemo.com/dunyanews/jfrstv_dunya_news_720p/playlist.m3u8",
        "category": "News",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "92_news",
        "name": "92 News",
        "logo": "https://jazztv.com.pk/images/channels/92-news.webp",
        "stream_url": "https://jfrs92.cdn.jfrstvdemo.com/92news/jfrstv_92_news_720p/playlist.m3u8",
        "category": "News",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "bol_news",
        "name": "BOL News",
        "logo": "https://jazztv.com.pk/images/channels/bol-news.webp",
        "stream_url": "https://jfrsbol.cdn.jfrstvdemo.com/bolnews/jfrstv_bol_news_720p/playlist.m3u8",
        "category": "News",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "hum_news",
        "name": "HUM News",
        "logo": "https://jazztv.com.pk/images/channels/hum-news.webp",
        "stream_url": "https://jfrshum.cdn.jfrstvdemo.com/humnews/jfrstv_hum_news_720p/playlist.m3u8",
        "category": "News",
        "provider": "JazzTV",
        "active": True
    },
    # Entertainment Channels
    {
        "id": "hum_tv",
        "name": "HUM TV",
        "logo": "https://jazztv.com.pk/images/channels/hum-tv.webp",
        "stream_url": "https://jfrshum.cdn.jfrstvdemo.com/humtv/jfrstv_hum_tv_720p/playlist.m3u8",
        "category": "Entertainment",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "ary_digital",
        "name": "ARY Digital",
        "logo": "https://jazztv.com.pk/images/channels/ary-digital.webp",
        "stream_url": "https://jfrsary.cdn.jfrstvdemo.com/arydigital/jfrstv_ary_digital_720p/playlist.m3u8",
        "category": "Entertainment",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "geo_entertainment",
        "name": "Geo Entertainment",
        "logo": "https://jazztv.com.pk/images/channels/geo-entertainment.webp",
        "stream_url": "https://jfrsgeo.cdn.jfrstvdemo.com/geoent/jfrstv_geo_ent_720p/playlist.m3u8",
        "category": "Entertainment",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "express_ent",
        "name": "Express Entertainment",
        "logo": "https://jazztv.com.pk/images/channels/express-ent.webp",
        "stream_url": "https://jfrsexp.cdn.jfrstvdemo.com/expressent/jfrstv_express_ent_720p/playlist.m3u8",
        "category": "Entertainment",
        "provider": "JazzTV",
        "active": True
    },
    # Sports
    {
        "id": "ptv_sports",
        "name": "PTV Sports",
        "logo": "https://jazztv.com.pk/images/channels/ptv-sports.webp",
        "stream_url": "https://jfrsptv.cdn.jfrstvdemo.com/ptvsports/jfrstv_ptv_sports_720p/playlist.m3u8",
        "category": "Sports",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "ten_sports",
        "name": "Ten Sports",
        "logo": "https://jazztv.com.pk/images/channels/ten-sports.webp",
        "stream_url": "https://jfrsten.cdn.jfrstvdemo.com/tensports/jfrstv_ten_sports_720p/playlist.m3u8",
        "category": "Sports",
        "provider": "JazzTV",
        "active": True
    },
    # Religious
    {
        "id": "madani_channel",
        "name": "Madani Channel",
        "logo": "https://jazztv.com.pk/images/channels/madani.webp",
        "stream_url": "https://jfrsmadani.cdn.jfrstvdemo.com/madani/jfrstv_madani_720p/playlist.m3u8",
        "category": "Religious",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "qtv",
        "name": "QTV",
        "logo": "https://jazztv.com.pk/images/channels/qtv.webp",
        "stream_url": "https://jfrsqtv.cdn.jfrstvdemo.com/qtv/jfrstv_qtv_720p/playlist.m3u8",
        "category": "Religious",
        "provider": "JazzTV",
        "active": True
    },
    # Kids
    {
        "id": "cartoon_network",
        "name": "Cartoon Network",
        "logo": "https://jazztv.com.pk/images/channels/cartoon-network.webp",
        "stream_url": "https://jfrscn.cdn.jfrstvdemo.com/cn/jfrstv_cn_720p/playlist.m3u8",
        "category": "Kids",
        "provider": "JazzTV",
        "active": True
    },
    {
        "id": "nick",
        "name": "Nickelodeon",
        "logo": "https://jazztv.com.pk/images/channels/nick.webp",
        "stream_url": "https://jfrsnick.cdn.jfrstvdemo.com/nick/jfrstv_nick_720p/playlist.m3u8",
        "category": "Kids",
        "provider": "JazzTV",
        "active": True
    },
]

@api_router.get("/tools/live-tv/channels")
async def get_tv_channels(user: dict = Depends(get_current_user)):
    """Return all Jazz TV / Tamasha channels"""
    return {"channels": JAZZTV_CHANNELS, "total": len(JAZZTV_CHANNELS)}

@api_router.get("/tools/live-tv/channels/{category}")
async def get_tv_channels_by_category(category: str, user: dict = Depends(get_current_user)):
    """Return channels filtered by category"""
    filtered = [ch for ch in JAZZTV_CHANNELS if ch["category"].lower() == category.lower()]
    return {"channels": filtered, "total": len(filtered), "category": category}

@api_router.get("/tools/live-tv/stream/{channel_id}")
async def get_tv_stream(channel_id: str, user: dict = Depends(get_current_user)):
    cost = await check_credits(user, "live_tv")
    
    # Find channel by ID
    channel = next((ch for ch in JAZZTV_CHANNELS if ch["id"] == channel_id), None)
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if not channel.get("active", True):
        raise HTTPException(status_code=503, detail="Channel temporarily unavailable")
    
    await deduct_credits(user["id"], "live_tv", cost, "success", channel_id)
    
    return {
        "channel_id": channel_id,
        "channel_name": channel["name"],
        "stream_url": channel["stream_url"],
        "category": channel["category"],
        "credits_used": cost
    }

@api_router.post("/tools/tamasha-otp")
async def tamasha_otp(data: TamashaOTPRequest, user: dict = Depends(get_current_user)):
    cost = await check_credits(user, "tamasha_otp")
    
    try:
        if data.action == "send":
            # Placeholder for Tamasha OTP send
            await deduct_credits(user["id"], "tamasha_otp", cost, "success", f"send:{data.phone}")
            return {
                "success": True,
                "message": "OTP sent successfully (simulated). Configure Tamasha API for full functionality.",
                "credits_used": cost
            }
        elif data.action == "verify" and data.otp:
            # Placeholder for OTP verification
            return {
                "success": True,
                "message": "OTP verified (simulated). Configure Tamasha API for full functionality.",
                "credits_used": 0  # Verification is free
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tamasha OTP error: {str(e)}")

@api_router.get("/user/usage-history", response_model=List[UsageLogResponse])
async def get_user_usage_history(user: dict = Depends(get_current_user), limit: int = Query(50, le=200)):
    logs = await db.usage_logs.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return logs

@api_router.get("/")
async def root():
    return {"message": "OmniHub API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Startup event - Create admin users
@app.on_event("startup")
async def startup_event():
    # Main Super Admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@omnihub.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Super Admin",
            "password_hash": get_password_hash(admin_password),
            "role": "admin",
            "credits": 999999,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info(f"Super Admin created: {admin_email}")
    
    # Additional Admin accounts with 100 credits each
    additional_admins = [
        {"email": "admin1@omnihub.com", "password": "Admin1@123", "name": "Admin One"},
        {"email": "admin2@omnihub.com", "password": "Admin2@123", "name": "Admin Two"},
        {"email": "admin3@omnihub.com", "password": "Admin3@123", "name": "Admin Three"},
        {"email": "admin4@omnihub.com", "password": "Admin4@123", "name": "Admin Four"},
        {"email": "admin5@omnihub.com", "password": "Admin5@123", "name": "Admin Five"},
    ]
    
    for admin_data in additional_admins:
        existing = await db.users.find_one({"email": admin_data["email"]})
        if not existing:
            new_admin = {
                "id": str(uuid.uuid4()),
                "email": admin_data["email"],
                "name": admin_data["name"],
                "password_hash": get_password_hash(admin_data["password"]),
                "role": "admin",
                "credits": 100,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_admin)
            logger.info(f"Admin created: {admin_data['email']} with 100 credits")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.usage_logs.create_index("user_id")
    await db.usage_logs.create_index("created_at")
    await db.credit_logs.create_index("user_id")
    await db.credit_logs.create_index("created_at")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
