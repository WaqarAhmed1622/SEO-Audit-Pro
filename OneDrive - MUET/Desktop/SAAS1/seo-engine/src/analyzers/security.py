"""
Security Analyzer
Checks for security-related SEO factors
"""

import httpx
from typing import Dict, Any, List
from urllib.parse import urlparse


class SecurityAnalyzer:
    """Analyzes security aspects that affect SEO"""
    
    async def analyze(self, url: str, page_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform security analysis
        """
        issues = []
        checks = {}
        score = 100
        
        # Check HTTPS
        https_result = self._check_https(url)
        checks["https"] = https_result["passed"]
        if not https_result["passed"]:
            issues.append(https_result["issue"])
            score -= https_result["deduction"]
        
        # Check security headers
        headers_result = self._check_security_headers(page_data.get("headers", {}))
        checks["securityHeaders"] = headers_result["passed"]
        if not headers_result["passed"]:
            issues.extend(headers_result.get("issues", []))
            score -= headers_result["deduction"]
        
        # Check mixed content
        mixed_result = self._check_mixed_content(page_data)
        checks["noMixedContent"] = mixed_result["passed"]
        if not mixed_result["passed"]:
            issues.append(mixed_result["issue"])
            score -= mixed_result["deduction"]
        
        # Check for exposed sensitive paths
        sensitive_result = await self._check_sensitive_paths(url)
        checks["noSensitivePaths"] = sensitive_result["passed"]
        if not sensitive_result["passed"]:
            issues.extend(sensitive_result.get("issues", []))
            score -= sensitive_result["deduction"]
        
        return {
            "score": max(0, score),
            "issues": issues,
            "checks": checks,
            "data": {
                "https": url.startswith("https://"),
                "securityHeaders": self._list_security_headers(page_data.get("headers", {})),
            }
        }
    
    def _check_https(self, url: str) -> Dict:
        if not url.startswith("https://"):
            return {
                "passed": False,
                "issue": {
                    "type": "error",
                    "code": "no_https",
                    "message": "Site is not using HTTPS",
                    "recommendation": "Migrate to HTTPS immediately. It's a ranking factor.",
                    "impact": "high"
                },
                "deduction": 25
            }
        return {"passed": True, "deduction": 0}
    
    def _check_security_headers(self, headers: Dict) -> Dict:
        """Check for important security headers"""
        issues = []
        deduction = 0
        
        # Normalize header names - ensure headers is a dict
        if not headers:
            headers = {}
        headers_lower = {k.lower(): v for k, v in headers.items()}
        
        # X-Content-Type-Options
        if "x-content-type-options" not in headers_lower:
            issues.append({
                "type": "warning",
                "code": "missing_x_content_type",
                "message": "Missing X-Content-Type-Options header",
                "recommendation": "Add 'X-Content-Type-Options: nosniff' header",
                "impact": "low"
            })
            deduction += 2
        
        # X-Frame-Options or CSP frame-ancestors
        if "x-frame-options" not in headers_lower and "content-security-policy" not in headers_lower:
            issues.append({
                "type": "warning",
                "code": "missing_x_frame_options",
                "message": "Missing X-Frame-Options header",
                "recommendation": "Add X-Frame-Options to prevent clickjacking",
                "impact": "medium"
            })
            deduction += 3
        
        # Strict-Transport-Security
        if "strict-transport-security" not in headers_lower:
            issues.append({
                "type": "warning",
                "code": "missing_hsts",
                "message": "Missing Strict-Transport-Security header",
                "recommendation": "Add HSTS header for HTTPS enforcement",
                "impact": "medium"
            })
            deduction += 5
        
        # Content-Security-Policy
        if "content-security-policy" not in headers_lower:
            issues.append({
                "type": "recommendation",
                "code": "missing_csp",
                "message": "Missing Content-Security-Policy header",
                "recommendation": "Implement CSP to prevent XSS attacks",
                "impact": "medium"
            })
            deduction += 3
        
        return {
            "passed": len(issues) == 0,
            "issues": issues,
            "deduction": deduction
        }
    
    def _check_mixed_content(self, page_data: Dict) -> Dict:
        """Check for mixed content (HTTP resources on HTTPS page)"""
        url = page_data.get("url", "")
        
        if not url.startswith("https://"):
            return {"passed": True, "deduction": 0}
        
        # Check images
        http_images = [
            img for img in page_data.get("images", [])
            if img.get("src", "").startswith("http://")
        ]
        
        # Check scripts
        http_scripts = [
            s for s in page_data.get("scripts", [])
            if s.get("src", "").startswith("http://")
        ]
        
        # Check stylesheets
        http_styles = [
            s for s in page_data.get("stylesheets", [])
            if s.get("href", "").startswith("http://")
        ]
        
        total_mixed = len(http_images) + len(http_scripts) + len(http_styles)
        
        if total_mixed > 0:
            return {
                "passed": False,
                "issue": {
                    "type": "error",
                    "code": "mixed_content",
                    "message": f"Mixed content detected ({total_mixed} HTTP resources on HTTPS page)",
                    "recommendation": "Update all resources to use HTTPS",
                    "impact": "high"
                },
                "deduction": 15
            }
        
        return {"passed": True, "deduction": 0}
    
    async def _check_sensitive_paths(self, url: str) -> Dict:
        """Check for exposed sensitive paths"""
        issues = []
        deduction = 0
        
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        sensitive_paths = [
            "/.env",
            "/.git/config",
            "/wp-config.php.bak",
            "/phpinfo.php",
            "/.htaccess",
            "/server-status",
        ]
        
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                for path in sensitive_paths:
                    try:
                        response = await client.get(
                            f"{base_url}{path}",
                            follow_redirects=False
                        )
                        
                        if response.status_code == 200:
                            issues.append({
                                "type": "error",
                                "code": "exposed_sensitive_file",
                                "message": f"Sensitive file exposed: {path}",
                                "recommendation": "Block access to this file immediately",
                                "impact": "high"
                            })
                            deduction += 10
                    except:
                        continue
        except:
            pass
        
        return {
            "passed": len(issues) == 0,
            "issues": issues,
            "deduction": deduction
        }
    
    def _list_security_headers(self, headers: Dict) -> List[str]:
        """List the security headers present"""
        security_headers = [
            "strict-transport-security",
            "content-security-policy",
            "x-content-type-options",
            "x-frame-options",
            "x-xss-protection",
            "referrer-policy",
            "permissions-policy",
        ]
        
        if not headers:
            headers = {}
        headers_lower = {k.lower(): v for k, v in headers.items()}
        
        return [h for h in security_headers if h in headers_lower]
