import json
import os

# Check all JSON files for muscle_ids
files = [
    'band-final-video.json',
    'barbell-final-video.json',
    'bodyweigh-final-video.json',
    'dumbbell-final-video.json',
    'machine-final-video.json',
    'recovery-final-video.json',
    'smith-final-video.json'
]

results = {
    'lats': [],
    'traps': [],
    'hamstrings': [],
    'calves': []
}

for filename in files:
    filepath = f'c:/zenfit/Library/{filename}'
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            if 'data' in data:
                for ex in data['data']:
                    if 'muscle_ids' in ex:
                        muscle_ids = ex['muscle_ids']
                        for mid in muscle_ids:
                            mid_lower = mid.lower()
                            if 'lats' in mid_lower and len(results['lats']) < 5:
                                results['lats'].append({
                                    'file': filename,
                                    'name': ex.get('exercise_name_zh', 'N/A'),
                                    'muscle_ids': muscle_ids
                                })
                            if 'traps' in mid_lower and len(results['traps']) < 5:
                                results['traps'].append({
                                    'file': filename,
                                    'name': ex.get('exercise_name_zh', 'N/A'),
                                    'muscle_ids': muscle_ids
                                })
                            if 'hamstring' in mid_lower and len(results['hamstrings']) < 5:
                                results['hamstrings'].append({
                                    'file': filename,
                                    'name': ex.get('exercise_name_zh', 'N/A'),
                                    'muscle_ids': muscle_ids
                                })
                            if 'calv' in mid_lower and len(results['calves']) < 5:
                                results['calves'].append({
                                    'file': filename,
                                    'name': ex.get('exercise_name_zh', 'N/A'),
                                    'muscle_ids': muscle_ids
                                })
    except Exception as e:
        print(f"Error reading {filename}: {e}")

print(json.dumps(results, indent=2, ensure_ascii=False))
