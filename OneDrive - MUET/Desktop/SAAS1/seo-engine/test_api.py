import httpx
import json
import sys

def test_analyze():
    url = "http://localhost:8000/analyze"
    data = {"url": "https://example.com"}
    
    try:
        response = httpx.post(url, json=data, timeout=60)
        if response.status_code == 200:
            print("SUCCESS!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"ERROR {response.status_code}:")
            print(response.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_analyze()
