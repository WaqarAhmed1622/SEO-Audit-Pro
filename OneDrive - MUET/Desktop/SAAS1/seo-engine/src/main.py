"""
SEO Audit Engine - FastAPI Microservice
Performs comprehensive SEO analysis on websites
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv
import sentry_sdk

from crawler.crawler import Crawler
from analyzers.technical import TechnicalSEOAnalyzer
from analyzers.onpage import OnPageSEOAnalyzer
from analyzers.performance import PerformanceAnalyzer
from analyzers.security import SecurityAnalyzer

load_dotenv()

# Initialize Sentry
if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        traces_sample_rate=1.0,
    )

app = FastAPI(
    title="SEO Audit Engine",
    description="Comprehensive SEO analysis microservice",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_details = traceback.format_exc()
    print(f"GLOBAL ERROR: {error_details}", flush=True)
    return JSONResponse(
        status_code=500,
        content={"detail": error_details}
    )


class AnalyzeRequest(BaseModel):
    url: HttpUrl


class AnalyzeResponse(BaseModel):
    url: str
    technical: dict
    onPage: dict
    performance: dict
    security: dict
    mobile: dict
    overallScore: int


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "seo-engine"}


@app.post("/analyze")
async def analyze_url(request: AnalyzeRequest):
    """
    Analyze a URL for SEO issues
    Returns comprehensive SEO audit data
    """
    url = str(request.url)
    
    try:
        # Crawl the page
        crawler = Crawler()
        page_data = await crawler.crawl(url)
        
        if not page_data:
            raise HTTPException(status_code=400, detail="Failed to crawl URL")
        
        # Check if crawler returned an error
        if "error" in page_data:
            raise HTTPException(status_code=400, detail=f"Failed to crawl URL: {page_data.get('error')}")
        
        # Run all analyzers
        technical_analyzer = TechnicalSEOAnalyzer()
        onpage_analyzer = OnPageSEOAnalyzer()
        performance_analyzer = PerformanceAnalyzer()
        security_analyzer = SecurityAnalyzer()
        
        technical_results = await technical_analyzer.analyze(url, page_data)
        onpage_results = await onpage_analyzer.analyze(page_data)
        performance_results = await performance_analyzer.analyze(url)
        security_results = await security_analyzer.analyze(url, page_data)
        
        # Calculate mobile score (subset of other checks)
        mobile_score = calculate_mobile_score(page_data, performance_results)
        
        # Calculate overall score
        overall_score = calculate_overall_score(
            technical_results["score"],
            onpage_results["score"],
            performance_results["score"],
            security_results["score"],
            mobile_score["score"]
        )
        
        return {
            "url": url,
            "technical": technical_results,
            "onPage": onpage_results,
            "performance": performance_results,
            "security": security_results,
            "mobile": mobile_score,
            "overallScore": overall_score
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import sys
        error_details = traceback.format_exc()
        print(f"ERROR in analyze: {error_details}", file=sys.stderr, flush=True)
        sentry_sdk.capture_exception(e)
        raise HTTPException(status_code=500, detail=error_details)


def calculate_mobile_score(page_data: dict, performance: dict) -> dict:
    """Calculate mobile-specific score"""
    issues = []
    score = 100
    
    # Check viewport meta
    if not page_data.get("viewport_meta"):
        issues.append({
            "type": "error",
            "message": "Missing viewport meta tag",
            "impact": "high"
        })
        score -= 20
    
    # Check touch targets (simplified)
    small_buttons = page_data.get("small_touch_targets", 0)
    if small_buttons > 0:
        issues.append({
            "type": "warning",
            "message": f"{small_buttons} touch targets are too small",
            "impact": "medium"
        })
        score -= min(small_buttons * 2, 15)
    
    # Check font sizes
    if page_data.get("small_text_count", 0) > 5:
        issues.append({
            "type": "warning",
            "message": "Text too small to read on mobile",
            "impact": "medium"
        })
        score -= 10
    
    # Check content width
    if page_data.get("horizontal_scroll"):
        issues.append({
            "type": "error",
            "message": "Content wider than screen",
            "impact": "high"
        })
        score -= 15
    
    return {
        "score": max(0, score),
        "issues": issues,
        "checks": {
            "viewportMeta": page_data.get("viewport_meta", False),
            "touchTargets": small_buttons == 0,
            "readableText": page_data.get("small_text_count", 0) <= 5,
            "noHorizontalScroll": not page_data.get("horizontal_scroll", False)
        }
    }


def calculate_overall_score(
    technical: int,
    onpage: int,
    performance: int,
    security: int,
    mobile: int
) -> int:
    """Calculate weighted overall SEO score"""
    weights = {
        "technical": 0.25,
        "onpage": 0.25,
        "performance": 0.25,
        "security": 0.10,
        "mobile": 0.15
    }
    
    score = (
        technical * weights["technical"] +
        onpage * weights["onpage"] +
        performance * weights["performance"] +
        security * weights["security"] +
        mobile * weights["mobile"]
    )
    
    return round(score)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
