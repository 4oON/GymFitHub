import json

def search_videos():
    print("--- Searching for Videos ---")
    
    # Search Machine for Lat Pulldown
    try:
        with open('c:/zenfit/Library/machine-final-video.json', 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            print("\nLat Pulldown Matches:")
            for ex in data.get('data', []):
                name = ex.get('muscle_module_en', '').lower()
                if 'lat' in name and 'pulldown' in name:
                    print(f"{ex.get('muscle_module_en')}: {ex.get('video-front')}")
    except Exception as e:
        print(f"Error reading machine json: {e}")

    # Search Bodyweight for Scapular
    try:
        with open('c:/zenfit/Library/bodyweigh-final-video.json', 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            print("\nScapular Matches:")
            for ex in data.get('data', []):
                name = ex.get('muscle_module_en', '').lower()
                if 'scapular' in name:
                    print(f"{ex.get('muscle_module_en')}: {ex.get('video-front')}")
    except Exception as e:
        print(f"Error reading bodyweight json: {e}")

if __name__ == "__main__":
    search_videos()
