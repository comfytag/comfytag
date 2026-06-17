#!/usr/bin/env python3
"""
Logo Asset Generator
Converts SVG logo to multiple PNG sizes and formats needed across all apps
"""

import os
import sys
from pathlib import Path

# Check for required packages
try:
    from PIL import Image, ImageDraw
    import io
except ImportError:
    print("Pillow package required. Install with: pip install Pillow cairosvg")
    sys.exit(1)

try:
    import cairosvg
except ImportError:
    print("cairosvg package required. Install with: pip install cairosvg")
    sys.exit(1)

SOURCE_SVG = Path(__file__).parent.parent / "apps" / "web" / "public" / "logo.png"
APPS = ["web", "partner", "admin"]

SIZES = [
    ("favicon", 32, "favicon.png"),
    ("logo-small", 192, "logo192.png"),
    ("logo-medium", 256, "logo.png"),
    ("logo-large", 512, "logo512.png"),
    ("apple-touch-icon", 180, "apple-touch-icon.png"),
]

def generate_assets():
    print("🎨 Generating logo assets from SVG...\n")

    if not SOURCE_SVG.exists():
        print(f"Error: Source SVG not found at {SOURCE_SVG}")
        sys.exit(1)

    # Generate PNG versions from SVG
    for name, size, output_filename in SIZES:
        print(f"  Generating {name} ({size}x{size})...")

        try:
            # Convert SVG to PNG using cairosvg
            png_bytes = io.BytesIO()
            cairosvg.svg2png(
                url=str(SOURCE_SVG),
                write_to=png_bytes,
                output_width=size,
                output_height=size
            )
            png_bytes.seek(0)

            # Save to each app's public directory
            for app in APPS:
                output_dir = Path(__file__).parent.parent / "apps" / app / "public"
                output_dir.mkdir(parents=True, exist_ok=True)

                output_path = output_dir / output_filename
                with open(output_path, "wb") as f:
                    f.write(png_bytes.getvalue())

                print(f"    ✓ {app}/public/{output_filename}")

            png_bytes.seek(0)  # Reset for next iteration if needed

        except Exception as e:
            print(f"  ✗ Failed to generate {name}: {str(e)}")
            sys.exit(1)

    # Copy SVG to all apps
    print(f"\n  Copying SVG to all apps...")
    for app in APPS:
        output_dir = Path(__file__).parent.parent / "apps" / app / "public"
        output_dir.mkdir(parents=True, exist_ok=True)

        output_path = output_dir / "logo.png"
        with open(SOURCE_SVG, "r") as src:
            with open(output_path, "w") as dst:
                dst.write(src.read())

        print(f"    ✓ {app}/public/logo.png")

    # Mobile app assets
    print(f"\n  Setting up mobile app assets...")
    mobile_dir = Path(__file__).parent.parent / "apps" / "mobile" / "assets"
    mobile_dir.mkdir(parents=True, exist_ok=True)

    try:
        png_bytes = io.BytesIO()
        cairosvg.svg2png(
            url=str(SOURCE_SVG),
            write_to=png_bytes,
            output_width=192,
            output_height=192
        )
        png_bytes.seek(0)

        with open(mobile_dir / "icon.png", "wb") as f:
            f.write(png_bytes.getvalue())

        print(f"    ✓ mobile/assets/icon.png (192x192)")
    except Exception as e:
        print(f"  ✗ Failed to generate mobile icon: {str(e)}")

    print("\n✅ Logo assets generated successfully!\n")
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
    generate_assets()
