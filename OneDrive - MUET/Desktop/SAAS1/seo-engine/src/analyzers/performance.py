"""
Performance Analyzer
Uses Google PageSpeed Insights API for performance metrics
"""

import os
import httpx
from typing import Dict, Any


class PerformanceAnalyzer:
    """Analyzes page performance using PageSpeed Insights API"""
    
    def __init__(self):
        self.api_key = os.getenv("PAGESPEED_API_KEY", "")
        self.api_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    
    async def analyze(self, url: str) -> Dict[str, Any]:
        """
        Analyze page performance using PageSpeed Insights
        """
        issues = []
        checks = {}
        
        # If no API key, return estimated scores based on simple checks
        if not self.api_key:
            return self._get_fallback_analysis(url)
        
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.get(
                    self.api_url,
                    params={
                        "url": url,
                        "key": self.api_key,
                        "category": ["performance", "accessibility", "best-practices", "seo"],
                        "strategy": "mobile"
                    }
                )
                
                if response.status_code != 200:
                    return self._get_fallback_analysis(url)
                
                data = response.json()
                
                # Extract Lighthouse scores
                lighthouse = data.get("lighthouseResult", {})
                categories = lighthouse.get("categories", {})
                audits = lighthouse.get("audits", {})
                
                performance_score = int((categories.get("performance", {}).get("score", 0) or 0) * 100)
                
                # Core Web Vitals
                lcp = self._get_metric(audits, "largest-contentful-paint")
                fid = self._get_metric(audits, "max-potential-fid")
                cls = self._get_metric(audits, "cumulative-layout-shift")
                fcp = self._get_metric(audits, "first-contentful-paint")
                ttfb = self._get_metric(audits, "server-response-time")
                
                # Check LCP
                if lcp and lcp.get("numericValue", 0) > 2500:
                    issues.append({
                        "type": "error",
                        "code": "slow_lcp",
                        "message": f"Largest Contentful Paint is slow ({lcp.get('displayValue')})",
                        "recommendation": "Optimize images, remove render-blocking resources",
                        "impact": "high"
                    })
                    checks["lcp"] = False
                else:
                    checks["lcp"] = True
                
                # Check CLS
                if cls and cls.get("numericValue", 0) > 0.1:
                    issues.append({
                        "type": "warning",
                        "code": "high_cls",
                        "message": f"Cumulative Layout Shift is high ({cls.get('displayValue')})",
                        "recommendation": "Specify image dimensions, avoid dynamic content insertion",
                        "impact": "medium"
                    })
                    checks["cls"] = False
                else:
                    checks["cls"] = True
                
                # Check FCP
                if fcp and fcp.get("numericValue", 0) > 1800:
                    issues.append({
                        "type": "warning",
                        "code": "slow_fcp",
                        "message": f"First Contentful Paint is slow ({fcp.get('displayValue')})",
                        "recommendation": "Reduce server response time, optimize critical rendering path",
                        "impact": "medium"
                    })
                    checks["fcp"] = False
                else:
                    checks["fcp"] = True
                
                # Image optimization
                unoptimized_images = audits.get("uses-optimized-images", {})
                if unoptimized_images.get("score", 1) < 0.9:
                    issues.append({
                        "type": "warning",
                        "code": "unoptimized_images",
                        "message": "Images are not optimized",
                        "recommendation": "Compress images and use modern formats (WebP)",
                        "impact": "medium"
                    })
                    checks["imageOptimization"] = False
                else:
                    checks["imageOptimization"] = True
                
                # JavaScript bundle size
                js_bundle = audits.get("total-byte-weight", {})
                if js_bundle.get("numericValue", 0) > 2000000:  # 2MB
                    issues.append({
                        "type": "warning",
                        "code": "large_bundle",
                        "message": "Page size is too large",
                        "recommendation": "Reduce JavaScript bundle size, lazy load non-critical resources",
                        "impact": "medium"
                    })
                    checks["bundleSize"] = False
                else:
                    checks["bundleSize"] = True
                
                # Lazy loading
                lazy_load = audits.get("offscreen-images", {})
                checks["lazyLoading"] = lazy_load.get("score", 0) >= 0.9
                
                return {
                    "score": performance_score,
                    "issues": issues,
                    "checks": checks,
                    "data": {
                        "performanceScore": performance_score,
                        "lcp": lcp.get("displayValue") if lcp else None,
                        "lcpMs": lcp.get("numericValue") if lcp else None,
                        "fcp": fcp.get("displayValue") if fcp else None,
                        "fcpMs": fcp.get("numericValue") if fcp else None,
                        "cls": cls.get("displayValue") if cls else None,
                        "clsValue": cls.get("numericValue") if cls else None,
                        "ttfb": ttfb.get("displayValue") if ttfb else None,
                        "ttfbMs": ttfb.get("numericValue") if ttfb else None,
                    }
                }
                
        except Exception as e:
            return self._get_fallback_analysis(url)
    
    def _get_metric(self, audits: Dict, metric_name: str) -> Dict:
        """Extract a metric from Lighthouse audits"""
        return audits.get(metric_name, {})
    
    def _get_fallback_analysis(self, url: str) -> Dict:
        """Return a basic analysis when PageSpeed API is unavailable"""
        return {
            "score": 50,  # Unknown, assume average
            "issues": [
                {
                    "type": "info",
                    "code": "pagespeed_unavailable",
                    "message": "PageSpeed Insights API not available",
                    "recommendation": "Configure PAGESPEED_API_KEY for detailed performance analysis",
                    "impact": "low"
                }
            ],
            "checks": {
                "lcp": None,
                "fcp": None,
                "cls": None,
                "imageOptimization": None,
                "bundleSize": None,
                "lazyLoading": None,
            },
            "data": {
                "performanceScore": None,
                "note": "Detailed metrics require PageSpeed API key"
            }
        }
