import sys
import os
sys.path.insert(0, os.path.abspath('pyjsparser-master'))

from pyjsparser import parse

with open('js/admin.js', 'r', encoding='utf-8') as f:
    text = f.read()

try:
    parse(text)
    print("Parsed successfully!")
except Exception as e:
    print(f"Error: {e}")
