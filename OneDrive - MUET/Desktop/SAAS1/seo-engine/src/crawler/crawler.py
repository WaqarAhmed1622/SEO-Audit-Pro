"""
Web Crawler - Fetches and parses web pages for SEO analysis
"""

import asyncio
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Optional, Dict, Any
import re


class Crawler:
    """Crawls web pages and extracts SEO-relevant data"""
    
    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "SEOAuditBot/1.0 (+https://seoaudit.com/bot)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
    
    async def crawl(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Crawl a URL and extract all SEO-relevant data
        """
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True,
                verify=True
            ) as client:
                response = await client.get(url, headers=self.headers)
                
                # Parse HTML
                soup = BeautifulSoup(response.text, 'lxml')
                
                # Extract all data
                data = {
                    "url": str(response.url),
                    "status_code": response.status_code,
                    "response_time": response.elapsed.total_seconds(),
                    "content_length": len(response.content),
                    "headers": dict(response.headers),
                    "redirects": [str(r.url) for r in response.history],
                    
                    # Meta tags
                    "title": self._get_title(soup),
                    "meta_description": self._get_meta_description(soup),
                    "canonical": self._get_canonical(soup, url),
                    "robots_meta": self._get_robots_meta(soup),
                    "viewport_meta": self._get_viewport_meta(soup),
                    
                    # Open Graph
                    "og_tags": self._get_og_tags(soup),
                    
                    # Headings
                    "headings": self._get_headings(soup),
                    
                    # Links
                    "internal_links": self._get_internal_links(soup, url),
                    "external_links": self._get_external_links(soup, url),
                    
                    # Images
                    "images": self._get_images(soup, url),
                    
                    # Content
                    "word_count": self._get_word_count(soup),
                    "text_content": self._get_text_content(soup),
                    
                    # Technical
                    "scripts": self._get_scripts(soup),
                    "stylesheets": self._get_stylesheets(soup),
                    "has_schema": self._has_schema(soup),
                    "schema_types": self._get_schema_types(soup),
                    
                    # Forms
                    "forms": self._get_forms(soup),
                    
                    # Language
                    "lang": self._get_language(soup),
                    
                    # HTML
                    "html": response.text,
                }
                
                return data
                
        except httpx.TimeoutException:
            return {"error": "timeout", "url": url}
        except httpx.RequestError as e:
            return {"error": str(e), "url": url}
        except Exception as e:
            return {"error": str(e), "url": url}
    
    def _get_title(self, soup: BeautifulSoup) -> Optional[str]:
        title_tag = soup.find('title')
        return title_tag.get_text(strip=True) if title_tag else None
    
    def _get_meta_description(self, soup: BeautifulSoup) -> Optional[str]:
        meta = soup.find('meta', attrs={'name': 'description'})
        return meta.get('content', '').strip() if meta else None
    
    def _get_canonical(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        link = soup.find('link', attrs={'rel': 'canonical'})
        if link and link.get('href'):
            return urljoin(base_url, link['href'])
        return None
    
    def _get_robots_meta(self, soup: BeautifulSoup) -> Optional[str]:
        meta = soup.find('meta', attrs={'name': 'robots'})
        return meta.get('content', '').strip() if meta else None
    
    def _get_viewport_meta(self, soup: BeautifulSoup) -> bool:
        meta = soup.find('meta', attrs={'name': 'viewport'})
        return meta is not None
    
    def _get_og_tags(self, soup: BeautifulSoup) -> Dict[str, str]:
        og_tags = {}
        for meta in soup.find_all('meta', attrs={'property': re.compile(r'^og:')}):
            prop = meta.get('property', '').replace('og:', '')
            content = meta.get('content', '')
            if prop and content:
                og_tags[prop] = content
        return og_tags
    
    def _get_headings(self, soup: BeautifulSoup) -> Dict[str, list]:
        headings = {}
        for level in range(1, 7):
            tag = f'h{level}'
            headings[tag] = [
                h.get_text(strip=True) 
                for h in soup.find_all(tag)
            ]
        return headings
    
    def _get_internal_links(self, soup: BeautifulSoup, base_url: str) -> list:
        base_domain = urlparse(base_url).netloc
        internal = []
        
        for a in soup.find_all('a', href=True):
            href = a['href']
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)
            
            if parsed.netloc == base_domain or not parsed.netloc:
                internal.append({
                    "url": full_url,
                    "text": a.get_text(strip=True)[:100],
                    "rel": a.get('rel', []),
                })
        
        return internal[:100]  # Limit to first 100
    
    def _get_external_links(self, soup: BeautifulSoup, base_url: str) -> list:
        base_domain = urlparse(base_url).netloc
        external = []
        
        for a in soup.find_all('a', href=True):
            href = a['href']
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)
            
            if parsed.netloc and parsed.netloc != base_domain:
                external.append({
                    "url": full_url,
                    "text": a.get_text(strip=True)[:100],
                    "rel": a.get('rel', []),
                    "nofollow": 'nofollow' in a.get('rel', []),
                })
        
        return external[:50]
    
    def _get_images(self, soup: BeautifulSoup, base_url: str) -> list:
        images = []
        
        for img in soup.find_all('img'):
            src = img.get('src', '')
            if src:
                images.append({
                    "src": urljoin(base_url, src),
                    "alt": img.get('alt', ''),
                    "has_alt": bool(img.get('alt')),
                    "loading": img.get('loading', ''),
                    "width": img.get('width', ''),
                    "height": img.get('height', ''),
                })
        
        return images[:100]
    
    def _get_word_count(self, soup: BeautifulSoup) -> int:
        text = self._get_text_content(soup)
        words = text.split()
        return len(words)
    
    def _get_text_content(self, soup: BeautifulSoup) -> str:
        # Remove script and style elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header']):
            element.decompose()
        
        text = soup.get_text(separator=' ')
        # Clean up whitespace
        text = ' '.join(text.split())
        return text[:10000]  # Limit to 10k chars
    
    def _get_scripts(self, soup: BeautifulSoup) -> list:
        scripts = []
        for script in soup.find_all('script', src=True):
            scripts.append({
                "src": script['src'],
                "async": script.has_attr('async'),
                "defer": script.has_attr('defer'),
            })
        return scripts
    
    def _get_stylesheets(self, soup: BeautifulSoup) -> list:
        stylesheets = []
        for link in soup.find_all('link', rel='stylesheet'):
            if link.get('href'):
                stylesheets.append({
                    "href": link['href'],
                })
        return stylesheets
    
    def _has_schema(self, soup: BeautifulSoup) -> bool:
        # Check for JSON-LD
        json_ld = soup.find('script', type='application/ld+json')
        if json_ld:
            return True
        
        # Check for microdata
        if soup.find(attrs={'itemscope': True}):
            return True
        
        return False
    
    def _get_schema_types(self, soup: BeautifulSoup) -> list:
        types = []
        
        # JSON-LD
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                import json
                data = json.loads(script.string)
                if isinstance(data, dict) and '@type' in data:
                    types.append(data['@type'])
                elif isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and '@type' in item:
                            types.append(item['@type'])
            except:
                pass
        
        # Microdata
        for elem in soup.find_all(attrs={'itemtype': True}):
            types.append(elem['itemtype'])
        
        return types
    
    def _get_forms(self, soup: BeautifulSoup) -> list:
        forms = []
        for form in soup.find_all('form'):
            forms.append({
                "action": form.get('action', ''),
                "method": form.get('method', 'get'),
                "has_csrf": bool(form.find('input', attrs={'name': re.compile(r'csrf|token', re.I)})),
            })
        return forms
    
    def _get_language(self, soup: BeautifulSoup) -> Optional[str]:
        html = soup.find('html')
        if html:
            return html.get('lang')
        return None
