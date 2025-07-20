import re

base_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,;:!?'\"+-*/=<>()[]{}@#$%^&_|\~`"
all_text = base_chars

file_paths = ['index.html', 'fallback.html']

for path in file_paths:
    try:
        with open(path, 'rb') as f:
            raw_data = f.read()
            content = raw_data.decode('utf-8', errors='ignore')
            
            content = re.sub(r'<script.*?>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
            content = re.sub(r'<style.*?>.*?</style>', '', content, flags=re.DOTALL | re.IGNORECASE)
            content = re.sub(r'<.*?>', '', content)
            content = re.sub(r'\s+', '', content)
            
            all_text += content
    except FileNotFoundError:
        print(f"Warning: File not found at {path}, skipping.")

unique_chars = sorted(list(set(all_text)))

with open('chars.txt', 'w', encoding='utf-8') as f:
    f.write("".join(unique_chars))

print(f"Success! {len(unique_chars)} unique characters written to chars.txt.")