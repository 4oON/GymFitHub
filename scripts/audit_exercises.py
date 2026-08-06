import json
import re
import os

def audit_constants():
    print("--- Auditing constants.ts ---")
    try:
        with open('c:/zenfit/constants.ts', 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract exercise objects (simplified regex approach)
        # This assumes standard formatting in constants.ts
        exercises = []
        # Find blocks that look like exercise definitions
        # This is a heuristic; might need adjustment
        matches = re.finditer(r'\{\s*id:\s*[\'"]([^\'"]+)[\'"]', content)
        
        for match in matches:
            start_index = match.start()
            # Find the end of the object (counting braces)
            brace_count = 0
            end_index = start_index
            found_start = False
            for i in range(start_index, len(content)):
                if content[i] == '{':
                    brace_count += 1
                    found_start = True
                elif content[i] == '}':
                    brace_count -= 1
                
                if found_start and brace_count == 0:
                    end_index = i + 1
                    break
            
            ex_block = content[start_index:end_index]
            ex_id = match.group(1)
            
            issues = []
            if 'difficulty:' not in ex_block:
                issues.append('Missing difficulty')
            if 'videoUrl:' not in ex_block:
                issues.append('Missing videoUrl')
            if 'muscle_ids:' not in ex_block:
                 # muscle_ids is optional in interface but user requested it
                 # We'll flag it as a warning
                 issues.append('Missing muscle_ids (Warning)')

            if issues:
                print(f"Exercise {ex_id}: {', '.join(issues)}")

    except Exception as e:
        print(f"Error reading constants.ts: {e}")

def audit_json_library():
    print("\n--- Auditing JSON Library ---")
    files = [f for f in os.listdir('c:/zenfit/Library') if f.endswith('.json')]
    
    for filename in files:
        filepath = f'c:/zenfit/Library/{filename}'
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)
                if 'data' in data:
                    for i, ex in enumerate(data['data']):
                        name = ex.get('muscle_module_en', f'Index {i}')
                        issues = []
                        
                        if not ex.get('difficulty'):
                            issues.append('Missing difficulty')
                        if not ex.get('video-front'):
                            issues.append('Missing video-front')
                        if not ex.get('muscle_ids'):
                            issues.append('Missing muscle_ids')
                            
                        if issues:
                            print(f"File {filename} - {name}: {', '.join(issues)}")
        except Exception as e:
            print(f"Error reading {filename}: {e}")

if __name__ == "__main__":
    audit_constants()
    audit_json_library()
