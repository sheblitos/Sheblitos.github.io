#!/usr/bin/env python3
"""From Zero series (3 carousel posts). Same engine and style as make_posts.py.
Config zero/posts.json, captions zero/captions/, output zero/output/. Slides in photos/zero-pN/."""
import sys
from pathlib import Path
import make_posts as m
Z = Path(__file__).resolve().parent / "zero"
m.CONFIG, m.CAPTIONS, m.OUT, m.REVIEW = Z / "posts.json", Z / "captions", Z / "output", Z / "review"
if __name__ == "__main__":
    sys.exit(m.main(sys.argv[1:]))
