"""
Technical SEO Analyzer
Checks for technical SEO issues like canonical, robots, sitemap, etc.
"""

import httpx
from typing import Dict, Any, List
from urllib.parse import urljoin, urlparse


class TechnicalSEOAnalyzer:
    """Analyzes technical SEO aspects of a webpage"""
    
    async def analyze(self, url: str, page_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform technical SEO analysis
        """
        issues = []
        checks = {}
        score = 100
        
        # Check canonical tag
        canonical_result = self._check_canonical(url, page_data)
        checks["canonical"] = canonical_result["passed"]
        if not canonical_result["passed"]:
            issues.append(canonical_result["issue"])
            score -= canonical_result["deduction"]
        
        # Check robots meta
        robots_result = self._check_robots(page_data)
        checks["robotsMeta"] = robots_result["passed"]
        if not robots_result["passed"]:
            issues.append(robots_result["issue"])
            score -= robots_result["deduction"]
        
        # Check robots.txt
        robots_txt_result = await self._check_robots_txt(url)
        checks["robotsTxt"] = robots_txt_result["passed"]
        if not robots_txt_result["passed"]:
            issues.append(robots_txt_result["issue"])
            score -= robots_txt_result["deduction"]
        
        # Check sitemap
        sitemap_result = await self._check_sitemap(url)
        checks["sitemap"] = sitemap_result["passed"]
        if not sitemap_result["passed"]:
            issues.append(sitemap_result["issue"])
            score -= sitemap_result["deduction"]
        
        # Check HTTPS
        https_result = self._check_https(url)
        checks["https"] = https_result["passed"]
        if not https_result["passed"]:
            issues.append(https_result["issue"])
            score -= https_result["deduction"]
        
        # Check redirects
        redirect_result = self._check_redirects(page_data)
        checks["redirectChain"] = redirect_result["passed"]
        if not redirect_result["passed"]:
            issues.append(redirect_result["issue"])
            score -= redirect_result["deduction"]
        
        # Check status code
        status_result = self._check_status_code(page_data)
        checks["statusCode"] = status_result["passed"]
        if not status_result["passed"]:
            issues.append(status_result["issue"])
            score -= status_result["deduction"]
        
        # Check language attribute
        lang_result = self._check_language(page_data)
        checks["language"] = lang_result["passed"]
        if not lang_result["passed"]:
            issues.append(lang_result["issue"])
            score -= lang_result["deduction"]
        
        # Check structured data
        schema_result = self._check_schema(page_data)
        checks["structuredData"] = schema_result["passed"]
        if not schema_result["passed"]:
            issues.append(schema_result["issue"])
            score -= schema_result["deduction"]
        
        return {
            "score": max(0, score),
            "issues": issues,
            "checks": checks,
            "data": {
                "canonical": page_data.get("canonical"),
                "robotsMeta": page_data.get("robots_meta"),
                "redirectCount": len(page_data.get("redirects") or []),
                "statusCode": page_data.get("status_code"),
                "schemaTypes": page_data.get("schema_types") or [],
            }
        }
    
    def _check_canonical(self, url: str, page_data: Dict) -> Dict:
        canonical = page_data.get("canonical")
        
        if not canonical:
            return {
                "passed": False,
                "issue": {
                    "type": "error",
                    "code": "missing_canonical",
                    "message": "Missing canonical tag",
                    "recommendation": "Add a canonical tag to specify the preferred URL for this page",
                    "impact": "high"
                },
                "deduction": 15
            }
        
        # Check if canonical matches current URL
        if urlparse(canonical).path != urlparse(url).path:
            return {
                "passed": True,
                "issue": {
                    "type": "warning",
                    "code": "canonical_mismatch",
                    "message": f"Canonical URL ({canonical}) differs from current URL",
                    "recommendation": "Verify this is intentional",
                    "impact": "low"
                },
                "deduction": 0
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_robots(self, page_data: Dict) -> Dict:
        robots = page_data.get("robots_meta", "")
        
        if robots and "noindex" in robots.lower():
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "noindex",
                    "message": "Page is set to noindex",
                    "recommendation": "Remove noindex if you want this page to be indexed",
                    "impact": "high"
                },
                "deduction": 5
            }
        
        return {"passed": True, "deduction": 0}
    
    async def _check_robots_txt(self, url: str) -> Dict:
        try:
            parsed = urlparse(url)
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(robots_url)
                
                if response.status_code == 200:
                    return {"passed": True, "deduction": 0}
                else:
                    return {
                        "passed": False,
                        "issue": {
                            "type": "warning",
                            "code": "missing_robots_txt",
                            "message": "robots.txt not found",
                            "recommendation": "Add a robots.txt file to control crawler access",
                            "impact": "medium"
                        },
                        "deduction": 5
                    }
        except:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "robots_txt_error",
                    "message": "Could not access robots.txt",
                    "impact": "low"
                },
                "deduction": 3
            }
    
    async def _check_sitemap(self, url: str) -> Dict:
        try:
            parsed = urlparse(url)
            sitemap_urls = [
                f"{parsed.scheme}://{parsed.netloc}/sitemap.xml",
                f"{parsed.scheme}://{parsed.netloc}/sitemap_index.xml",
            ]
            
            async with httpx.AsyncClient(timeout=10) as client:
                for sitemap_url in sitemap_urls:
                    try:
                        response = await client.get(sitemap_url)
                        if response.status_code == 200 and 'xml' in response.headers.get('content-type', ''):
                            return {"passed": True, "deduction": 0}
                    except:
                        continue
            
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "missing_sitemap",
                    "message": "XML sitemap not found",
                    "recommendation": "Add an XML sitemap to help search engines discover your pages",
                    "impact": "medium"
                },
                "deduction": 5
            }
        except:
            return {"passed": False, "deduction": 3, "issue": {"type": "error", "message": "Sitemap check failed"}}
    
    def _check_https(self, url: str) -> Dict:
        if not url.startswith("https://"):
            return {
                "passed": False,
                "issue": {
                    "type": "error",
                    "code": "no_https",
                    "message": "Site is not using HTTPS",
                    "recommendation": "Migrate to HTTPS for security and SEO benefits",
                    "impact": "high"
                },
                "deduction": 20
            }
        return {"passed": True, "deduction": 0}
    
    def _check_redirects(self, page_data: Dict) -> Dict:
        redirects = page_data.get("redirects") or []
        
        if len(redirects) > 2:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "redirect_chain",
                    "message": f"Redirect chain detected ({len(redirects)} redirects)",
                    "recommendation": "Reduce redirect chain to a single redirect",
                    "impact": "medium"
                },
                "deduction": 10
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_status_code(self, page_data: Dict) -> Dict:
        status = page_data.get("status_code")
        
        if status and status >= 400:
            return {
                "passed": False,
                "issue": {
                    "type": "error",
                    "code": "error_status",
                    "message": f"Page returned status code {status}",
                    "impact": "high"
                },
                "deduction": 30
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_language(self, page_data: Dict) -> Dict:
        lang = page_data.get("lang")
        
        if not lang:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "missing_lang",
                    "message": "Missing language attribute on HTML tag",
                    "recommendation": "Add lang attribute to help search engines understand the page language",
                    "impact": "low"
                },
                "deduction": 3
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_schema(self, page_data: Dict) -> Dict:
        has_schema = page_data.get("has_schema", False)
        
        if not has_schema:
            return {
                "passed": False,
                "issue": {
                    "type": "recommendation",
                    "code": "no_structured_data",
                    "message": "No structured data (Schema.org) found",
                    "recommendation": "Add structured data to enhance search results appearance",
                    "impact": "medium"
                },
                "deduction": 5
            }
        
        return {"passed": True, "deduction": 0}
