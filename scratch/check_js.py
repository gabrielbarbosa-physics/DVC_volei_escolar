import sys

def check_file(filepath):
    print(f"Checking {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Failed to read file: {e}")
        return False

    # Check balanced curly braces, square brackets, and parentheses
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    lines = content.split('\n')
    
    in_string = False
    string_char = None
    escaped = False
    in_comment_single = False
    in_comment_multi = False
    
    for i, line in enumerate(lines, 1):
        j = 0
        while j < len(line):
            char = line[j]
            
            if in_comment_single:
                break # Single line comment ends at newline
                
            if in_comment_multi:
                if j < len(line) - 1 and char == '*' and line[j+1] == '/':
                    in_comment_multi = False
                    j += 2
                    continue
                j += 1
                continue
                
            if in_string:
                if escaped:
                    escaped = False
                elif char == '\\':
                    escaped = True
                elif char == string_char:
                    in_string = False
                    string_char = None
                j += 1
                continue
                
            # Check for comments start
            if j < len(line) - 1 and char == '/' and line[j+1] == '/':
                in_comment_single = True
                break
            if j < len(line) - 1 and char == '/' and line[j+1] == '*':
                in_comment_multi = True
                j += 2
                continue
                
            # Check for strings start
            if char in ["'", '"', '`']:
                in_string = True
                string_char = char
                j += 1
                continue
                
            if char in mapping.values():
                stack.append((char, i, j))
            elif char in mapping.keys():
                if not stack:
                    print(f"Unmatched closing character '{char}' at line {i}, col {j}")
                    return False
                top, line_num, col_num = stack.pop()
                if top != mapping[char]:
                    print(f"Mismatch: '{char}' at line {i}, col {j} matches '{top}' from line {line_num}, col {col_num}")
                    return False
            j += 1
            
        in_comment_single = False # reset at end of line

    if stack:
        print(f"Unclosed open characters left: {stack}")
        return False
        
    print(f"File {filepath} syntax/balanced structure is OK.")
    return True

if __name__ == "__main__":
    success = True
    for fp in ["js/quarterly-survey.js", "js/auth.js", "js/main.js"]:
        if not check_file(fp):
            success = False
    if not success:
        sys.exit(1)
    else:
        print("All checks passed successfully.")
