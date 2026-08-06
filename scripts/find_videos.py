import json

# Exercise names to search for
exercises_to_find = {
    'barbell_shrug': '杠铃耸肩',
    'farmers_walk': '农夫行走',
    'dumbbell_shrug': '哑铃耸肩',
}

files = [
    'band-final-video.json',
    'barbell-final-video.json',
    'bodyweigh-final-video.json',
    'dumbbell-final-video.json',
    'machine-final-video.json',
    'recovery-final-video.json',
    'smith-final-video.json'
]

results = {}

for filename in files:
    filepath = f'c:/zenfit/Library/{filename}'
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            if 'data' in data:
                for ex in data['data']:
                    name_zh = ex.get('exercise_name_zh', '')
                    for key, search_term in exercises_to_find.items():
                        if search_term in name_zh and key not in results:
                            results[key] = {
                                'name_zh': name_zh,
                                'name_en': ex.get('muscle_module_en', ''),
                                'video_front': ex.get('video-front', ''),
                                'video_side': ex.get('video-side', ''),
                                'file': filename
                            }
    except Exception as e:
        print(f"Error reading {filename}: {e}")

print(json.dumps(results, indent=2, ensure_ascii=False))
