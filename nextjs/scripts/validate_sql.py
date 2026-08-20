#!/usr/bin/env python3
"""Validate balanced structure of umami-foods-import.sql."""
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "umami-foods-import.sql"
raw = open(path, encoding="utf-8").read()

lines = [l for l in raw.split("\n") if not l.strip().startswith("--")]
code = "\n".join(lines)

paren = 0
brack = 0
in_str = False
errors = []
i = 0
n = len(code)
while i < n:
    ch = code[i]
    if in_str:
        if ch == "'":
            if i + 1 < n and code[i + 1] == "'":  # escaped apostrophe (doubled)
                i += 2
                continue
            in_str = False
        i += 1
        continue
    if ch == "'":
        in_str = True
    elif ch == "(":
        paren += 1
    elif ch == ")":
        paren -= 1
        if paren < 0:
            errors.append(f"unbalanced ) at index {i}")
            break
    elif ch == "[":
        brack += 1
    elif ch == "]":
        brack -= 1
        if brack < 0:
            errors.append(f"unbalanced ] at index {i}")
            break
    i += 1

if in_str:
    errors.append("unterminated single-quoted string")

if errors:
    print("STRUCTURE ERRORS:")
    for e in errors:
        print("  -", e)
else:
    print(f"STRUCTURE OK: paren_depth={paren}, bracket_depth={brack}")

# Basic presence / statement checks
print("categories INSERT present:", "INSERT INTO categories" in raw)
print("products INSERT present:", "INSERT INTO products" in raw)
print("ON CONFLICT categories present:", "ON CONFLICT (slug) DO NOTHING" in raw)
print("product rows:", raw.count("((SELECT id FROM categories WHERE slug"))