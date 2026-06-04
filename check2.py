import sys
import re

def remove_strings_and_comments(text):
    result = []
    i = 0
    in_str = False
    str_char = ''
    in_sc = False
    in_mc = False
    in_regex = False
    in_template = False
    
    while i < len(text):
        c = text[i]
        
        if in_sc:
            if c == '\n':
                in_sc = False
            i += 1
            continue
            
        if in_mc:
            if c == '*' and i+1 < len(text) and text[i+1] == '/':
                in_mc = False
                i += 2
                continue
            i += 1
            continue
            
        if in_str:
            if c == '\\':
                i += 2
                continue
            if c == str_char:
                in_str = False
            i += 1
            continue
            
        if in_template:
            if c == '\\':
                i += 2
                continue
            if c == '`':
                in_template = False
            # Not handling string interpolation properly, just ignore braces inside
            i += 1
            continue
            
        # skip regex syntax for simplicity, we don't strictly need it if we aren't matching inside regexes
        # actually regex can contain { and }. Let's assume regexes don't contain unbalanced braces
        
        # check start of comment
        if c == '/' and i+1 < len(text):
            if text[i+1] == '/':
                in_sc = True
                i += 2
                continue
            if text[i+1] == '*':
                in_mc = True
                i += 2
                continue
                
        # check start of string
        if c in '\"\'':
            in_str = True
            str_char = c
            i += 1
            continue
            
        # check start of template
        if c == '`':
            in_template = True
            i += 1
            continue
            
        if c in '{}':
            result.append((c, i))
            
        i += 1
        
    return result

with open('js/admin.js', 'r', encoding='utf-8') as f:
    text = f.read()
    
braces = remove_strings_and_comments(text)
stack = []
for b, pos in braces:
    if b == '{':
        stack.append(pos)
    else:
        if not stack:
            print(f'Extra }} at {pos}')
        else:
            stack.pop()

if stack:
    for pos in stack:
        line = text[:pos].count('\n') + 1
        print(f'Unclosed {{ at line {line}')
