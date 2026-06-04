import sys

def check_brackets(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    stack = []
    in_string = False
    string_char = ''
    in_comment_line = False
    in_comment_block = False
    in_template = False
    escape_next = False
    
    lines = text.split('\n')
    
    line_num = 1
    col_num = 1
    
    for i, char in enumerate(text):
        if char == '\n':
            line_num += 1
            col_num = 1
            in_comment_line = False
            continue
        
        col_num += 1
        
        if escape_next:
            escape_next = False
            continue
            
        if char == '\\':
            escape_next = True
            continue
            
        if in_comment_line:
            continue
            
        if in_comment_block:
            if char == '*' and i + 1 < len(text) and text[i+1] == '/':
                in_comment_block = False
            continue
            
        if in_string:
            if char == string_char:
                in_string = False
            continue
            
        if in_template:
            if char == '`':
                in_template = False
            continue
            
        if char == '/' and i + 1 < len(text):
            if text[i+1] == '/':
                in_comment_line = True
                continue
            elif text[i+1] == '*':
                in_comment_block = True
                continue
                
        if char in ['\'', '\"']:
            in_string = True
            string_char = char
            continue
            
        if char == '`':
            in_template = True
            continue
            
        if char in ['{', '[', '(']:
            stack.append((char, line_num, col_num))
        elif char in ['}', ']', ')']:
            if not stack:
                print(f'Unmatched closing bracket {char} at line {line_num}')
                return
            top, top_line, top_col = stack.pop()
            matches = {'}': '{', ']': '[', ')': '('}
            if matches[char] != top:
                print(f'Mismatched bracket at line {line_num}: expected closing for {top} from line {top_line}, but got {char}')
                return
                
    if stack:
        print('Unmatched opening brackets:')
        for s in stack:
            print(f'Bracket {s[0]} at line {s[1]}')
    else:
        print('All brackets match!')

check_brackets('js/admin.js')
