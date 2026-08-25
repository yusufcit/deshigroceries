import re

p = 'src/app/page.tsx'
s = open(p).read()

# Add a consistent vertical margin to every top-level <section> opening tag.
pattern = re.compile(
    r'(<section(?:[^>]*?\bid="[^"]*")?\s+className=")(w-full)'
)

count = 0
def repl(m):
    global count
    count += 1
    return f'{m.group(1)}my-8 md:my-12 {m.group(2)}'

s2, n = pattern.subn(repl, s)
open(p, 'w').write(s2)
print('sections matched:', n)