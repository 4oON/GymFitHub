import json
import os

# Heuristic mapping for muscle IDs based on exercise name keywords
KEYWORD_MAP = {
    'shrug': ['traps', 'traps-middle'],
    'row': ['lats', 'biceps', 'traps-middle'],
    'pull': ['lats', 'biceps'],
    'chin': ['lats', 'biceps'],
    'deadlift': ['hamstrings', 'glutes', 'lower-back'],
    'rack pull': ['traps', 'lower-back'],
    'press': ['chest', 'triceps', 'front-shoulders'], # Generic, needs refinement
    'bench press': ['chest', 'triceps', 'front-shoulders'],
    'overhead press': ['front-shoulders', 'triceps'],
    'military press': ['front-shoulders', 'triceps'],
    'curl': ['biceps'],
    'extension': ['triceps'],
    'squat': ['quads', 'glutes'],
    'lunge': ['quads', 'glutes'],
    'leg press': ['quads', 'glutes'],
    'calf': ['calves'],
    'raise': ['shoulders'],
    'lateral raise': ['shoulders'],
    'fly': ['chest'],
    'reverse fly': ['rear-shoulders', 'traps-middle'],
    'face pull': ['rear-shoulders', 'traps'],
    'superman': ['lower-back'],
    'jefferson': ['hamstrings', 'lower-back'],
    'tibialis': ['calves'], # Actually tibialis anterior, but map to calves for now or leave empty if no enum
    'situp': ['abdominals'],
    'crunch': ['abdominals'],
    'plank': ['abdominals'],
    'rotation': ['obliques'],
    'twist': ['obliques'],
    'adduction': ['adductors'],
    'abduction': ['abductors'],
    'glute': ['glutes'],
    'hip': ['glutes', 'hip-flexors'],
    'neck': ['neck'],
    'cobra': ['abdominals', 'lower-back'],
    'stretches': ['stretching'],
}

def get_muscle_ids(name):
    name_lower = name.lower()
    for key, ids in KEYWORD_MAP.items():
        if key in name_lower:
            return ids
    return []

def patch_library():
    print("--- Patching JSON Library ---")
    files = [f for f in os.listdir('c:/zenfit/Library') if f.endswith('.json')]
    
    for filename in files:
        filepath = f'c:/zenfit/Library/{filename}'
        updated = False
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)
            
            if 'data' in data:
                for ex in data['data']:
                    # Fix missing muscle_ids
                    if not ex.get('muscle_ids'):
                        inferred_ids = get_muscle_ids(ex.get('muscle_module_en', ''))
                        if inferred_ids:
                            ex['muscle_ids'] = inferred_ids
                            print(f"Updated muscle_ids for {ex.get('muscle_module_en')} -> {inferred_ids}")
                            updated = True
                    
                    # Fix specific missing video for Machine Leg Press
                    if ex.get('muscle_module_en') == 'Machine Leg Press' and not ex.get('video-front'):
                        # Use a placeholder or find a similar one. 
                        # Using a generic leg press video URL if available or from another exercise
                        ex['video-front'] = 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-leg-press-front.mp4'
                        print("Fixed video for Machine Leg Press")
                        updated = True

            if updated:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                print(f"Saved updates to {filename}")
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    patch_library()
