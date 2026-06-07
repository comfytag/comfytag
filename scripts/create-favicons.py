#!/usr/bin/env python3
"""
Create favicon.ico files from PNG images
"""

import os
import sys
from pathlib import Path
from PIL import Image

APPS = ["web", "partner", "admin"]

def create_favicon_from_png(png_path, ico_path):
    """Convert PNG to ICO format"""
    try:
        img = Image.open(png_path)
        # Resize to 32x32 if needed
        if img.size != (32, 32):
            img = img.resize((32, 32), Image.Resampling.LANCZOS)
        # Save as ICO
        img.save(ico_path, 'ICO')
        return True
    except Exception as e:
        print(f"Error converting {png_path}: {e}")
        return False

def main():
    print("[*] Creating favicon.ico files from PNG...\n")

    for app in APPS:
        png_path = Path(f"apps/{app}/public/favicon.png")
        ico_path = Path(f"apps/{app}/public/favicon.ico")

        if png_path.exists():
            if create_favicon_from_png(png_path, ico_path):
                print(f"  [+] {app}/public/favicon.ico created")
            else:
                print(f"  [-] Failed to create {app}/public/favicon.ico")
        else:
            print(f"  [!] {png_path} not found")

    print("\n[OK] Favicon creation complete!")

if __name__ == "__main__":
    main()
