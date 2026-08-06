import json
import os

# Exercises to check in constants.ts (Lats and Traps)
exercises_to_check = {
    'Barbell Shrug': 'barbell-final-video.json',
    'Barbell Bent Over Row': 'barbell-final-video.json',
    'Barbell Pendlay Row': 'barbell-final-video.json',
    'Landmine Row': 'barbell-final-video.json', # Might be 'Landmine T-Bar Row'
    'Dumbbell Pullover': 'dumbbell-final-video.json',
    'Dumbbell Renegade Row': 'dumbbell-final-video.json',
    'V-Bar Lat Pulldown': 'machine-final-video.json', # Might need fuzzy match
    'Assisted Pull Up': 'machine-final-video.json',
    'Wide Grip Pull Up': 'bodyweigh-final-video.json', # Might be 'Pull Up'
    'Scapular Pull Up': 'bodyweigh-final-video.json'
}

def find_video_url(exercise_name, json_file):
    filepath = f'c:/zenfit/Library/{json_file}'
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            if 'data' in data:
                # Try exact match first
                for ex in data['data']:
                    if ex.get('muscle_module_en') == exercise_name:
                        return ex.get('video-front')
                
                # Try fuzzy match
                for ex in data['data']:
                    if exercise_name.lower() in ex.get('muscle_module_en', '').lower():
                        return ex.get('video-front')
                        
    except Exception as e:
        print(f"Error reading {json_file}: {e}")
    return None

print("--- Verifying Video URLs ---")
for name, json_file in exercises_to_check.items():
    url = find_video_url(name, json_file)
    print(f"{name}: {url}")
