import re

def scan_common_library():
    print("--- Scanning Common Library for Missing Videos ---")
    try:
        with open('c:/zenfit/constants.ts', 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find all exercise definitions
        matches = re.finditer(r'\{\s*id:\s*[\'"]([^\'"]+)[\'"]', content)
        
        missing_count = 0
        for match in matches:
            start_index = match.start()
            # Find end of block
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
            
            # Check for videoUrl
            video_match = re.search(r'videoUrl:\s*[\'"]([^\'"]*)[\'"]', ex_block)
            
            if not video_match or not video_match.group(1).strip():
                print(f"Missing video: {ex_id}")
                missing_count += 1
            elif 'fallback' in video_match.group(1):
                 print(f"Fallback video (suspicious): {ex_id}")
                 missing_count += 1

        if missing_count == 0:
            print("No missing videos found in Common Library.")

    except Exception as e:
        print(f"Error reading constants.ts: {e}")

if __name__ == "__main__":
    scan_common_library()
