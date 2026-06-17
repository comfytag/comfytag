#!/usr/bin/env python3
"""
Logo Asset Generator - Simple version using PIL only
Creates solid color PNG files matching the ComfyTag brand colors
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw

APPS = ["web", "partner", "admin"]

SIZES = [
    ("favicon", 32, "favicon.png"),
    ("logo-small", 192, "logo192.png"),
    ("logo-medium", 256, "logo.png"),
    ("logo-large", 512, "logo512.png"),
    ("apple-touch-icon", 180, "apple-touch-icon.png"),
]

def create_logo_image(size):
    """Create a ComfyTag logo image with brand colors"""
    # ComfyTag brand colors: blue/teal #0EA5E9 with green #10B981
    img = Image.new('RGB', (size, size), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Main circle (teal background)
    margin = size // 8
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=(14, 165, 233),  # #0EA5E9
        outline=(10, 185, 129),  # #10B981
        width=max(1, size // 32)
    )

    # Inner circle (lighter)
    inner_margin = margin + size // 16
    draw.ellipse(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        fill=(6, 182, 212),  # #06B6D4
    )

    # Face recognition icon (center)
    center = size // 2
    radius = size // 6

    # Eyes
    eye_y = center - size // 12
    left_eye_x = center - size // 12
    right_eye_x = center + size // 12
    eye_size = size // 32

    draw.ellipse(
        [left_eye_x - eye_size, eye_y - eye_size, left_eye_x + eye_size, eye_y + eye_size],
        fill=(255, 255, 255)
    )
    draw.ellipse(
        [right_eye_x - eye_size, eye_y - eye_size, right_eye_x + eye_size, eye_y + eye_size],
        fill=(255, 255, 255)
    )

    # Smile (green accent)
    smile_y = center + size // 12
    draw.arc(
        [center - size // 10, smile_y - size // 16, center + size // 10, smile_y + size // 16],
        0, 180,
        fill=(16, 185, 129),  # #10B981
        width=max(1, size // 32)
    )

    return img

def generate_assets():
    print("[*] Generating logo assets from brand design...\n")

    # Generate PNG versions
    for name, size, output_filename in SIZES:
        print(f"  Generating {name} ({size}x{size})...")

        try:
            # Create logo image
            img = create_logo_image(size)

            # Save to each app's public directory
            for app in APPS:
                output_dir = Path(__file__).parent.parent / "apps" / app / "public"
                output_dir.mkdir(parents=True, exist_ok=True)

                output_path = output_dir / output_filename
                img.save(output_path, "PNG")

                print(f"    [+] {app}/public/{output_filename}")

        except Exception as e:
            print(f"  ✗ Failed to generate {name}: {str(e)}")
            sys.exit(1)

    # Copy SVG to all apps
    print(f"\n  Copying SVG to all apps...")
    svg_path = Path(__file__).parent.parent / "apps" / "web" / "public" / "logo.png"

    if svg_path.exists():
        for app in APPS:
            output_dir = Path(__file__).parent.parent / "apps" / app / "public"
            output_dir.mkdir(parents=True, exist_ok=True)

            output_path = output_dir / "logo.png"
            with open(svg_path, "r") as src:
                with open(output_path, "w") as dst:
                    dst.write(src.read())

            print(f"    [+] {app}/public/logo.png")
    else:
        print(f"  ⚠ SVG not found at {svg_path}")

    # Mobile app assets
    print(f"\n  Setting up mobile app assets...")
    mobile_dir = Path(__file__).parent.parent / "apps" / "mobile" / "assets"
    mobile_dir.mkdir(parents=True, exist_ok=True)

    try:
        img = create_logo_image(192)
        img.save(mobile_dir / "icon.png", "PNG")
        print(f"    [+] mobile/assets/icon.png (192x192)")
    except Exception as e:
        print(f"  ✗ Failed to generate mobile icon: {str(e)}")

    print("\n[OK] Logo assets generated successfully!\n")
    print("Generated files:")
    print("  - favicon.png (32x32)")
    print("  - logo192.png (192x192)")
    print("  - logo.png (256x256)")
    print("  - logo512.png (512x512)")
    print("  - apple-touch-icon.png (180x180)")
    print("  - logo.png (scalable)")
    print("\nLocations:")
    print("  - apps/web/public/")
    print("  - apps/partner/public/")
    print("  - apps/admin/public/")
    print("  - apps/mobile/assets/")

if __name__ == "__main__":
    try:
        generate_assets()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
