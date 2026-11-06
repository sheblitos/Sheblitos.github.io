# LinkedIn Content Studio

Captions and images for Shebl's LinkedIn posts.

```
pip install -r requirements.txt
python make_posts.py 1 5     # render posts 01 and 05
python make_posts.py         # render everything whose photos exist
```

- `posts.json`: one entry per post (depth, pillar, headline lines, subline, images).
  Image types: `graphic`, `photo` (`mode`: `overlay` or `clean`, optional `focus: [x, y]`), `screenshot`.
- `captions/post-XX.txt`: caption source. Copied to `output/post-XX/caption.txt` and checked
  (length, no dashes, no bullets, 3 hashtags at the end).
- `photos/post-XX.jpg`: raw photos. Faces are found with YuNet (`models/`) and the crop keeps them in frame.
  QA fails if any text touches a face or an edge.
- `review/contact-sheet.png`: every image of the last batch.
- `posts-log.md`: schedule and results.

Fonts: Instrument Serif and DM Mono (SIL Open Font License, see `fonts/OFL-*.txt`).
Face model: YuNet from opencv_zoo (MIT).

Operating system (footer slogan and content pillars):
Go deep. Find the signal. Build the test. Bring it to the surface.
Pillars: GO DEEP, FIND THE SIGNAL, BUILD THE TEST, BRING IT TO THE SURFACE (results, case studies, clear ask; once or twice a month).

Image options in posts.json: `"pure": true` (top layout, true colors, for breathing photos), `"crop_top": 0.3`
(start lower in a tall photo), `"type": "raw"` (a finished slide used as is), and a post-level
`"carousel": "<folder in photos/>"` that builds `carousel.pdf` for a LinkedIn document post.
See content-bank.md for every photo and the story it can carry.

## Freediving Brain company page
`python make_fdb.py` renders the company page posts in the school's brand (deep green, mint, Mulish, logo mark).
Config `fdb/posts.json`, captions `fdb/captions/`, output `fdb/output/`, schedule `fdb/posts-log.md` (Wednesday and Friday).
