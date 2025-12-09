"""Direct test of analyzers to find NoneType error"""
import asyncio
import sys
sys.path.insert(0, 'src')

from crawler.crawler import Crawler
from analyzers.technical import TechnicalSEOAnalyzer
from analyzers.onpage import OnPageSEOAnalyzer
from analyzers.performance import PerformanceAnalyzer
from analyzers.security import SecurityAnalyzer

async def test():
    url = "https://example.com"
    
    print("1. Testing crawler...")
    crawler = Crawler()
    page_data = await crawler.crawl(url)
    print(f"   Crawler returned: {type(page_data)}")
    if "error" in page_data:
        print(f"   ERROR: {page_data['error']}")
        return
    print(f"   Keys: {page_data.keys()}")
    
    print("\n2. Testing TechnicalSEOAnalyzer...")
    try:
        technical = TechnicalSEOAnalyzer()
        result = await technical.analyze(url, page_data)
        print(f"   Score: {result.get('score')}")
    except Exception as e:
        print(f"   ERROR: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n3. Testing OnPageSEOAnalyzer...")
    try:
        onpage = OnPageSEOAnalyzer()
        result = await onpage.analyze(page_data)
        print(f"   Score: {result.get('score')}")
    except Exception as e:
        print(f"   ERROR: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n4. Testing PerformanceAnalyzer...")
    try:
        perf = PerformanceAnalyzer()
        result = await perf.analyze(url)
        print(f"   Score: {result.get('score')}")
    except Exception as e:
        print(f"   ERROR: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n5. Testing SecurityAnalyzer...")
    try:
        security = SecurityAnalyzer()
        result = await security.analyze(url, page_data)
        print(f"   Score: {result.get('score')}")
    except Exception as e:
        print(f"   ERROR: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n=== ALL TESTS PASSED ===")

if __name__ == "__main__":
    asyncio.run(test())
