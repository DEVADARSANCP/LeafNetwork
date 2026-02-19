"""
Multi-Agent Disease Intelligence Platform — FastAPI Backend

Endpoints:
  POST /api/vision/analyze          — Image upload → HF disease classification
  GET  /api/climate/risk            — Weather data → outbreak risk scoring
  GET  /api/satellite/health        — Vegetation health index
  POST /api/orchestrate             — Multi-agent synthesis via Groq LLM
  GET  /api/market/intelligence     — Mandi price + signals + recommendation
  POST /api/farmer/profile          — Save farmer profile from onboarding
  GET  /api/farmer/profile/{id}     — Get farmer profile
  GET  /api/farmer/dashboard/{id}   — Dashboard data using farmer prefs
  GET  /api/health                  — Health check
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from database import init_db, SessionLocal
from models.db_models import FarmerProfile
from models.farmer_schemas import FarmerProfileCreate, FarmerProfileResponse

from agents.vision_agent import analyze_image
from agents.climate_agent import get_climate_risk
from agents.satellite_agent import get_satellite_health
from agents.orchestrator import run_orchestration
from agents.outlier_orchestrator import run_orchestration
from domains.market import (
    get_market_data,
    get_price_trend_series,
    get_available_filters,
    get_market_records,
    enrich_market_data,
    compute_trade_recommendation,
    to_market_summary,
    to_chart_series,
    resolve_coords_for_state,
)
from models.schemas import AgentInput

@asynccontextmanager
async def lifespan(app):
    init_db()
    yield

app = FastAPI(
    title="Disease Intelligence Platform API",
    description="Multi-agent backend for plant disease detection, climate risk, and satellite health.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ──
@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agents": ["vision", "climate", "satellite", "orchestrator"],
    }


# ── Farmer Profile ──
@app.post("/api/farmer/profile")
async def save_farmer_profile(profile: FarmerProfileCreate):
    """Save or create a farmer profile from onboarding data."""
    try:
        db = SessionLocal()
        try:
            farmer = FarmerProfile(
                farmer_type=profile.farmer_type,
                full_name=profile.full_name,
                mobile=profile.mobile,
                location=profile.location,
                district=profile.district,
                state=profile.state,
                land_size=profile.land_size,
                soil_type=profile.soil_type,
                available_capital=profile.available_capital,
                has_loan_access=profile.has_loan_access,
                has_subsidy_access=profile.has_subsidy_access,
                has_irrigation=profile.has_irrigation,
                irrigation_type=profile.irrigation_type,
                has_storage=profile.has_storage,
                storage_capacity_tons=profile.storage_capacity_tons,
                current_crops=profile.current_crops,
                interested_crops=profile.interested_crops,
                technology_interest=profile.technology_interest,
                yearly_yield_tons=profile.yearly_yield_tons,
                selling_markets=profile.selling_markets,
                primary_commodity=profile.primary_commodity,
                primary_region=profile.primary_region,
                time_commitment=profile.time_commitment,
                no_land_option=profile.no_land_option,
                has_land=profile.has_land,
                onboarding_completed=True,
                profile_completeness=100.0,
            )
            db.add(farmer)
            db.commit()
            db.refresh(farmer)
            return {"id": farmer.id, "status": "created"}
        finally:
            db.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile save failed: {str(e)}")


@app.get("/api/farmer/profile/{farmer_id}")
async def get_farmer_profile(farmer_id: str):
    """Get a farmer profile by ID."""
    try:
        db = SessionLocal()
        try:
            farmer = db.query(FarmerProfile).filter(FarmerProfile.id == farmer_id).first()
            if not farmer:
                raise HTTPException(status_code=404, detail="Farmer not found")
            return FarmerProfileResponse.model_validate(farmer)
        finally:
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile fetch failed: {str(e)}")


@app.get("/api/farmer/dashboard/{farmer_id}")
async def farmer_dashboard(farmer_id: str):
    """
    Dashboard data using the farmer's saved commodity and region preferences.
    Returns market intelligence tailored to the farmer's onboarding choices.
    """
    try:
        # 1. Load farmer profile
        db = SessionLocal()
        try:
            farmer = db.query(FarmerProfile).filter(FarmerProfile.id == farmer_id).first()
            if not farmer:
                raise HTTPException(status_code=404, detail="Farmer not found")
        finally:
            db.close()

        # 2. Use farmer preferences to query market data
        region = farmer.primary_region or "Kerala_Kottayam"
        commodity = farmer.primary_commodity or "Banana"

        import asyncio
        raw, series = await asyncio.gather(
            get_market_data(region, commodity),
            get_price_trend_series(region, commodity, days=14),
        )
        from domains.market.market_signals import compute_price_momentum
        enriched = enrich_market_data(raw, series)
        momentum = compute_price_momentum(series)
        enriched["momentum"] = momentum
        recommendation = compute_trade_recommendation(
            trend=enriched.get("trend", "stable"),
            buyer_signal=enriched.get("buyer_signal", "Stable"),
            momentum=momentum.get("momentum", "neutral"),
        )
        summary = to_market_summary(enriched, recommendation)

        return {
            "farmer": {
                "id": farmer.id,
                "full_name": farmer.full_name,
                "primary_commodity": commodity,
                "primary_region": region,
                "land_size": farmer.land_size,
                "available_capital": farmer.available_capital,
            },
            "market": summary,
            "ai_recommendation": recommendation.get("action", "HOLD"),
            "recommendation_reason": recommendation.get("reason", ""),
            "consensus_score": recommendation.get("confidence", 70),
            "risk_level": enriched.get("risk_level", "Moderate"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard data failed: {str(e)}")


# ── Vision Detection Agent ──
@app.post("/api/vision/analyze")
async def vision_analyze(file: UploadFile = File(...)):
    """Upload a plant leaf image for disease classification."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")

    try:
        image_bytes = await file.read()
        result = await analyze_image(image_bytes)
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {str(e)}")


# ── Climate Risk Agent ──
@app.get("/api/climate/risk")
async def climate_risk(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180),
):
    """Fetch real-time weather and compute outbreak risk for given coordinates."""
    try:
        result = await get_climate_risk(lat, lon)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Climate analysis failed: {str(e)}")


# ── Satellite Health Agent ──
@app.get("/api/satellite/health")
async def satellite_health(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180),
):
    """Fetch vegetation health data for given coordinates."""
    try:
        result = await get_satellite_health(lat, lon)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satellite analysis failed: {str(e)}")


# ── Orchestration Engine ──
@app.post("/api/orchestrate")
async def orchestrate(agent_input: AgentInput):
    """Synthesize all agent outputs using Groq LLM for unified recommendations."""
    try:
        result = await run_orchestration(agent_input.model_dump())
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orchestration failed: {str(e)}")



# ── Market Filters ──
@app.get("/api/market/filters")
async def market_filters():
    """Return topology (State->District) and commodities from CSV filenames."""
    try:
        return get_available_filters()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Filter discovery failed: {str(e)}")


# ── Market Intelligence (Domain Layer) ──
@app.get("/api/market/intelligence")
async def market_intelligence(
    region:    str = Query("Kerala_Kottayam", description="Region filename (e.g. Kerala_Kottayam)"),
    commodity: str = Query("Banana",          description="Commodity name (e.g. Banana)"),
    days:      int = Query(14,                description="Days of price history", ge=1, le=30),
):
    """
    Full market intelligence: price card + trend chart + trade recommendation.
    Powered by uploaded CSV files (backend/data/*.csv).
    """
    import asyncio
    try:
        raw, series = await asyncio.gather(
            get_market_data(region, commodity),
            get_price_trend_series(region, commodity, days=days),
        )
        from domains.market.market_signals import compute_price_momentum
        enriched       = enrich_market_data(raw, series)
        momentum       = compute_price_momentum(series)
        enriched["momentum"] = momentum
        recommendation = compute_trade_recommendation(
            trend        = enriched.get("trend", "stable"),
            buyer_signal = enriched.get("buyer_signal", "Stable"),
            momentum     = momentum.get("momentum", "neutral"),
        )
        chart   = to_chart_series(series)
        summary = to_market_summary(enriched, recommendation)
        summary["chart"] = chart
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Market intelligence failed: {str(e)}")


# ── Market Records (paginated, for data table) ──
@app.get("/api/market/records")
async def market_records(
    region:    str = Query("Kerala_Kottayam", description="Region filename"),
    commodity: str = Query("Banana",          description="Commodity name"),
    page:      int = Query(1,                 description="Page number", ge=1),
    page_size: int = Query(50,                description="Records per page", ge=10, le=200),
):
    """Paginated individual records for the data table."""
    try:
        return get_market_records(region, commodity, page, page_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Market records fetch failed: {str(e)}")


# ── Legacy: raw market data ──
@app.get("/api/market/data")
async def market_data(
    region:    str = Query("Kerala_Kottayam"),
    commodity: str = Query("Banana"),
):
    """Raw market data from CSV."""
    try:
        return await get_market_data(region, commodity)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Market data fetch failed: {str(e)}")


# ── AI Assistant Chat ──
from pydantic import BaseModel
from typing import List

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@app.post("/api/assistant/chat")
async def assistant_chat(req: ChatRequest):
    """AI farming assistant powered by Groq LLM."""
    from config import GROQ_API_KEY, GROQ_MODEL
    import httpx

    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")

    system_prompt = (
        "You are an expert AI agricultural assistant for Indian farmers. "
        "You provide advice on crop diseases, mandi prices, selling strategies, "
        "crop planning, weather risks, and government schemes. "
        "Keep answers concise, practical, and actionable. "
        "Use bullet points for lists. "
        "If asked about prices, mention typical mandi ranges. "
        "Support questions in English, Hindi, and Tamil. "
        "Always be encouraging and supportive of farmers."
    )

    groq_messages = [{"role": "system", "content": system_prompt}]
    for m in req.messages:
        if m.role in ("user", "assistant"):
            groq_messages.append({"role": m.role, "content": m.content})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": groq_messages,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Groq API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
