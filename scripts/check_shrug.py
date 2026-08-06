import json

try:
    with open('c:/zenfit/Library/barbell-final-video.json', 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
        print("\nBarbell Shrug Matches:")
        for ex in data.get('data', []):
            name = ex.get('muscle_module_en', '').lower()
            if 'shrug' in name:
                print(f"{ex.get('muscle_module_en')}: {ex.get('video-front')}")
except Exception as e:
    print(f"Error: {e}")
