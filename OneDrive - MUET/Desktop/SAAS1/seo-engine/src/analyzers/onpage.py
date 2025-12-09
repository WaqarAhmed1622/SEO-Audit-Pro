"""
On-Page SEO Analyzer
Checks for on-page SEO factors like titles, meta descriptions, headings, content, etc.
"""

import re
from typing import Dict, Any, List
from collections import Counter


class OnPageSEOAnalyzer:
    """Analyzes on-page SEO factors"""
    
    async def analyze(self, page_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform on-page SEO analysis
        """
        issues = []
        checks = {}
        score = 100
        
        # Check title
        title_result = self._check_title(page_data.get("title"))
        checks["title"] = title_result["passed"]
        if not title_result["passed"]:
            issues.append(title_result["issue"])
            score -= title_result["deduction"]
        
        # Check meta description
        desc_result = self._check_meta_description(page_data.get("meta_description"))
        checks["metaDescription"] = desc_result["passed"]
        if not desc_result["passed"]:
            issues.append(desc_result["issue"])
            score -= desc_result["deduction"]
        
        # Check H1
        h1_result = self._check_h1(page_data.get("headings", {}))
        checks["h1"] = h1_result["passed"]
        if not h1_result["passed"]:
            issues.append(h1_result["issue"])
            score -= h1_result["deduction"]
        
        # Check heading hierarchy
        hierarchy_result = self._check_heading_hierarchy(page_data.get("headings", {}))
        checks["headingHierarchy"] = hierarchy_result["passed"]
        if not hierarchy_result["passed"]:
            issues.append(hierarchy_result["issue"])
            score -= hierarchy_result["deduction"]
        
        # Check images
        image_result = self._check_images(page_data.get("images", []))
        checks["imageAlt"] = image_result["passed"]
        if not image_result["passed"]:
            issues.append(image_result["issue"])
            score -= image_result["deduction"]
        
        # Check content length
        content_result = self._check_content(page_data.get("word_count", 0))
        checks["contentLength"] = content_result["passed"]
        if not content_result["passed"]:
            issues.append(content_result["issue"])
            score -= content_result["deduction"]
        
        # Check internal links
        internal_result = self._check_internal_links(page_data.get("internal_links", []))
        checks["internalLinks"] = internal_result["passed"]
        if not internal_result["passed"]:
            issues.append(internal_result["issue"])
            score -= internal_result["deduction"]
        
        # Check Open Graph tags
        og_result = self._check_og_tags(page_data.get("og_tags", {}))
        checks["openGraph"] = og_result["passed"]
        if not og_result["passed"]:
            issues.append(og_result["issue"])
            score -= og_result["deduction"]
        
        # Keyword analysis
        keyword_data = self._analyze_keywords(page_data)
        
        return {
            "score": max(0, score),
            "issues": issues,
            "checks": checks,
            "data": {
                "title": page_data.get("title"),
                "titleLength": len(page_data.get("title") or ""),
                "metaDescription": page_data.get("meta_description"),
                "metaDescriptionLength": len(page_data.get("meta_description") or ""),
                "wordCount": page_data.get("word_count") or 0,
                "h1Count": len(page_data.get("headings", {}).get("h1") or []),
                "imagesWithoutAlt": sum(1 for img in (page_data.get("images") or []) if not img.get("has_alt")),
                "internalLinkCount": len(page_data.get("internal_links") or []),
                "externalLinkCount": len(page_data.get("external_links") or []),
                "topKeywords": keyword_data.get("top_keywords", []),
            }
        }
    
    def _check_title(self, title: str) -> Dict:
        if not title:
            return {
                "passed": False,
                "issue": {
                    "type": "error",
                    "code": "missing_title",
                    "message": "Missing title tag",
                    "recommendation": "Add a unique, descriptive title tag (50-60 characters)",
                    "impact": "high"
                },
                "deduction": 20
            }
        
        length = len(title)
        
        if length < 30:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "title_too_short",
                    "message": f"Title is too short ({length} characters)",
                    "recommendation": "Title should be 50-60 characters for optimal display",
                    "impact": "medium"
                },
                "deduction": 5
            }
        
        if length > 60:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "title_too_long",
                    "message": f"Title is too long ({length} characters)",
                    "recommendation": "Title may be truncated in search results. Keep it under 60 characters",
                    "impact": "low"
                },
                "deduction": 3
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_meta_description(self, description: str) -> Dict:
        if not description:
            return {
                "passed": False,
                "issue": {
                    "type": "error",
                    "code": "missing_meta_description",
                    "message": "Missing meta description",
                    "recommendation": "Add a compelling meta description (150-160 characters)",
                    "impact": "high"
                },
                "deduction": 15
            }
        
        length = len(description)
        
        if length < 70:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "meta_description_too_short",
                    "message": f"Meta description is too short ({length} characters)",
                    "recommendation": "Meta description should be 150-160 characters",
                    "impact": "medium"
                },
                "deduction": 5
            }
        
        if length > 160:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "meta_description_too_long",
                    "message": f"Meta description is too long ({length} characters)",
                    "recommendation": "Meta description may be truncated. Keep it under 160 characters",
                    "impact": "low"
                },
                "deduction": 3
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_h1(self, headings: Dict) -> Dict:
        h1s = headings.get("h1", [])
        
        if not h1s:
            return {
                "passed": False,
                "issue": {
                    "type": "error",
                    "code": "missing_h1",
                    "message": "No H1 heading found",
                    "recommendation": "Add exactly one H1 heading that describes the page content",
                    "impact": "high"
                },
                "deduction": 15
            }
        
        if len(h1s) > 1:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "multiple_h1",
                    "message": f"Multiple H1 headings found ({len(h1s)})",
                    "recommendation": "Use only one H1 heading per page",
                    "impact": "medium"
                },
                "deduction": 5
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_heading_hierarchy(self, headings: Dict) -> Dict:
        # Check if headings follow proper hierarchy
        has_h1 = bool(headings.get("h1"))
        has_h2 = bool(headings.get("h2"))
        has_h3 = bool(headings.get("h3"))
        
        # Skip H2/H3 directly without H1
        if not has_h1 and (has_h2 or has_h3):
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "broken_heading_hierarchy",
                    "message": "Heading hierarchy is broken (H2/H3 without H1)",
                    "recommendation": "Maintain proper heading hierarchy (H1 → H2 → H3)",
                    "impact": "medium"
                },
                "deduction": 5
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_images(self, images: List[Dict]) -> Dict:
        if not images:
            return {"passed": True, "deduction": 0}
        
        missing_alt = [img for img in images if not img.get("has_alt")]
        missing_count = len(missing_alt)
        
        if missing_count > 0:
            percentage = (missing_count / len(images)) * 100
            
            if percentage > 50:
                return {
                    "passed": False,
                    "issue": {
                        "type": "error",
                        "code": "many_images_missing_alt",
                        "message": f"{missing_count} images missing alt text ({percentage:.0f}%)",
                        "recommendation": "Add descriptive alt text to all images for accessibility and SEO",
                        "impact": "high"
                    },
                    "deduction": 15
                }
            else:
                return {
                    "passed": False,
                    "issue": {
                        "type": "warning",
                        "code": "images_missing_alt",
                        "message": f"{missing_count} images missing alt text",
                        "recommendation": "Add descriptive alt text to all images",
                        "impact": "medium"
                    },
                    "deduction": 5
                }
        
        return {"passed": True, "deduction": 0}
    
    def _check_content(self, word_count: int) -> Dict:
        if word_count < 300:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "thin_content",
                    "message": f"Content is thin ({word_count} words)",
                    "recommendation": "Add more substantive content (aim for 800+ words for blog posts)",
                    "impact": "medium"
                },
                "deduction": 10
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_internal_links(self, internal_links: List[Dict]) -> Dict:
        if len(internal_links) < 2:
            return {
                "passed": False,
                "issue": {
                    "type": "warning",
                    "code": "few_internal_links",
                    "message": "Page has few internal links",
                    "recommendation": "Add more internal links to help users and search engines navigate",
                    "impact": "medium"
                },
                "deduction": 5
            }
        
        return {"passed": True, "deduction": 0}
    
    def _check_og_tags(self, og_tags: Dict) -> Dict:
        required = ["title", "description", "image"]
        missing = [tag for tag in required if tag not in og_tags]
        
        if missing:
            return {
                "passed": False,
                "issue": {
                    "type": "recommendation",
                    "code": "missing_og_tags",
                    "message": f"Missing Open Graph tags: {', '.join(missing)}",
                    "recommendation": "Add Open Graph tags for better social media sharing",
                    "impact": "low"
                },
                "deduction": 3
            }
        
        return {"passed": True, "deduction": 0}
    
    def _analyze_keywords(self, page_data: Dict) -> Dict:
        """Extract and analyze keywords from content"""
        text = page_data.get("text_content", "").lower()
        
        # Simple keyword extraction (remove common words)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
                      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                      'could', 'should', 'may', 'might', 'must', 'this', 'that', 'these',
                      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which',
                      'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
                      'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only',
                      'own', 'same', 'so', 'than', 'too', 'very', 'can', 'just', 'as', 'if'}
        
        words = re.findall(r'\b[a-z]{3,}\b', text)
        filtered_words = [w for w in words if w not in stop_words]
        
        word_counts = Counter(filtered_words)
        top_keywords = word_counts.most_common(10)
        
        return {
            "top_keywords": [{"word": w, "count": c} for w, c in top_keywords]
        }
