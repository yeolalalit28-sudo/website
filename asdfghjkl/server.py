from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class SIPCalculationRequest(BaseModel):
    monthly_amount: float
    period_years: int
    expected_return: float
    inflation_rate: float = 0
    step_up_percent: float = 0
    fund_type: str

class YearlyBreakdown(BaseModel):
    year: int
    invested_amount: float
    expected_value: float
    real_value: float

class SIPCalculationResponse(BaseModel):
    total_invested: float
    expected_returns: float
    maturity_value: float
    inflation_adjusted_value: float
    real_returns: float
    yearly_breakdown: List[YearlyBreakdown]

class FundInfo(BaseModel):
    name: str
    type: str
    expected_return: float
    risk_level: str
    description: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "SIP Calculator API"}

@api_router.get("/funds", response_model=List[FundInfo])
async def get_funds():
    """Get all available fund types with their details"""
    funds = [
        {
            "name": "Large Cap Fund",
            "type": "large_cap",
            "expected_return": 12.0,
            "risk_level": "Low to Moderate",
            "description": "Invests in top 100 companies by market cap. Stable and relatively lower risk."
        },
        {
            "name": "Mid Cap Fund",
            "type": "mid_cap",
            "expected_return": 14.0,
            "risk_level": "Moderate to High",
            "description": "Invests in companies ranked 101-250 by market cap. Higher growth potential."
        },
        {
            "name": "Small Cap Fund",
            "type": "small_cap",
            "expected_return": 16.0,
            "risk_level": "High",
            "description": "Invests in companies ranked 251+ by market cap. Highest growth potential with higher risk."
        },
        {
            "name": "Flexi Cap Fund",
            "type": "flexi_cap",
            "expected_return": 13.0,
            "risk_level": "Moderate",
            "description": "Invests across all market caps. Balanced approach with flexibility."
        }
    ]
    return funds

@api_router.post("/calculate-sip", response_model=SIPCalculationResponse)
async def calculate_sip(request: SIPCalculationRequest):
    """Calculate SIP returns with inflation and step-up considerations"""
    
    monthly_amount = request.monthly_amount
    period_years = request.period_years
    expected_return = request.expected_return / 100
    inflation_rate = request.inflation_rate / 100
    step_up_percent = request.step_up_percent / 100
    
    monthly_rate = expected_return / 12
    total_months = period_years * 12
    
    yearly_breakdown = []
    total_invested = 0
    maturity_value = 0
    
    # Calculate year by year with step-up
    for year in range(1, period_years + 1):
        # Adjust monthly amount for step-up (applied at the beginning of each year)
        if year > 1:
            monthly_amount = monthly_amount * (1 + step_up_percent)
        
        year_start_value = maturity_value
        year_invested = 0
        
        # Calculate for 12 months of this year
        for month in range(12):
            total_invested += monthly_amount
            year_invested += monthly_amount
            # Add new investment and apply monthly return to entire corpus
            maturity_value = (maturity_value + monthly_amount) * (1 + monthly_rate)
        
        # Calculate inflation-adjusted value
        inflation_factor = (1 + inflation_rate) ** year
        real_value = maturity_value / inflation_factor
        
        yearly_breakdown.append({
            "year": year,
            "invested_amount": round(total_invested, 2),
            "expected_value": round(maturity_value, 2),
            "real_value": round(real_value, 2)
        })
    
    expected_returns = maturity_value - total_invested
    inflation_adjusted_value = maturity_value / ((1 + inflation_rate) ** period_years)
    real_returns = inflation_adjusted_value - total_invested
    
    return {
        "total_invested": round(total_invested, 2),
        "expected_returns": round(expected_returns, 2),
        "maturity_value": round(maturity_value, 2),
        "inflation_adjusted_value": round(inflation_adjusted_value, 2),
        "real_returns": round(real_returns, 2),
        "yearly_breakdown": yearly_breakdown
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()