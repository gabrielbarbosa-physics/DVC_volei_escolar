import os
from PIL import Image

def convert_to_webp(folder_path):
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in ['.jpg', '.jpeg', '.png']:
                img_path = os.path.join(root, file)
                webp_path = os.path.join(root, os.path.splitext(file)[0] + '.webp')
                
                try:
                    with Image.open(img_path) as img:
                        # Convert RGBA to RGB if it's a JPEG or if we don't need alpha. WebP supports alpha though.
                        # but just to be safe with PIL formats
                        img.save(webp_path, 'webp', quality=85)
                    print(f"Converted {file} to WebP.")
                    os.remove(img_path)
                except Exception as e:
                    print(f"Failed to convert {file}: {e}")

if __name__ == "__main__":
    convert_to_webp("assets/img")
