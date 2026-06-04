import sys
import os
import re

sys.path.insert(0, os.path.abspath('pyjsparser-master'))
from pyjsparser import parse

def clean_template_literals(text):
    text = re.sub(r'\$\{[^}]*\}', '""', text)
    parts = text.split('`')
    cleaned_parts = []
    for idx, part in enumerate(parts):
        if idx % 2 == 1:
            part_clean = part.replace('\n', ' ').replace('"', '\\"')
            cleaned_parts.append(f'"{part_clean}"')
        else:
            cleaned_parts.append(part)
    return ''.join(cleaned_parts)

def validate_file(file_path):
    print(f"Validating {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('import ') or stripped.startswith('export '):
            cleaned_lines.append('')
        elif stripped.startswith('export const ') or stripped.startswith('export function '):
            cleaned_lines.append(line.replace('export const ', 'const ').replace('export function ', 'function '))
        else:
            cleaned_lines.append(line)

    cleaned_text = '\n'.join(cleaned_lines)
    cleaned_text = clean_template_literals(cleaned_text)
    
    # Replace ES2020 nullish coalescing ?? with ES5 Logical OR || for pyjsparser compatibility
    cleaned_text = cleaned_text.replace('??', '||')

    try:
        parse(cleaned_text)
        print(f"SUCCESS: {file_path} is syntactically valid!")
    except Exception as e:
        print(f"ERROR in {file_path}: {e}")
        match = re.search(r'Line (\d+)', str(e))
        if match:
            err_line = int(match.group(1))
            print("--- Context ---")
            start = max(0, err_line - 5)
            end = min(len(lines), err_line + 5)
            for idx in range(start, end):
                prefix = "-> " if idx + 1 == err_line else "   "
                print(f"{prefix}{idx+1}: {lines[idx]}")
            print("---------------")
        sys.exit(1)

validate_file('js/escalador.js')
validate_file('js/main.js')
validate_file('js/calendar.js')
