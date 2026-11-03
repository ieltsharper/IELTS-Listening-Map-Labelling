# Builds index.html and one page per map-labelling exercise from EXERCISES below.
# Run: python -I _generator/build.py   (from the repo folder or anywhere: paths are relative to this file)
#
# To add an exercise: crop the map into img/, add an entry, run the script.
# "audio" = the Google Drive file ID of the Part's track (file shared "Anyone with the link");
# leave it "" and the page says the audio is coming.
# In "transcript", {16:words} marks the words that give the answer to Question 16.
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

EXERCISES = [
    {
        "id": "cam19-test1-farley-house",
        "title": "Farley House",
        "book": "Cambridge IELTS 19",
        "test": "Test 1",
        "part": "Part 2",
        "range": "16–20",
        "letters": "ABCDEFGH",
        "image": "img/cam19-test1-farley-house.png",
        "alt": "Map of Farley House: a car park at the bottom (south), the old stables and the house above it, "
        "a large lake to the west, a smaller lake to the north-east, woods, paths and the letters A to H.",
        "audio": "",
        "cue": "The track is the whole of Part 2. Questions 16–20 start about halfway, when the speaker says "
        "<em>“Now on Sunday, we’ll be taking our visitors to Farley House.”</em> "
        "Before you play it, take 30 seconds to study the map: find the car park, the compass and the paths.",
        "questions": [
            (16, "Farm shop", "G"),
            (17, "Disabled entry", "C"),
            (18, "Adventure playground", "B"),
            (19, "Kitchen gardens", "D"),
            (20, "The Temple of the Four Winds", "A"),
        ],
        "transcript": [
            "Now on Sunday, we’ll be taking our visitors to Farley House. You may not all be familiar with it, "
            "so here’s a map to help you. You can see the car park at the bottom of the map. There’s an excellent "
            "farm shop in the grounds where our visitors can buy local produce – {16:it’s in the old stables, "
            "which is the first building you come to}. They’re built round a courtyard, and the shop’s "
            "{16:in the far corner on the left}. There’s also a small café on the right as you go in.",
            "I know that one or two of our visitors may not be all that mobile. The main entrance to the house "
            "has a lot of steps so you might want to use the disabled entry. {17:This is on the far side of the "
            "house from the car park}.",
            "Children will probably be most interested in the adventure playground. {18:That’s at the northern "
            "end of the larger lake, in a bend on the path that leads to the lake}. There’s lots for children "
            "to do there.",
            "There are a number of lovely gardens near the house. {19:The kitchen gardens are rectangular and "
            "surrounded by a wall. They’re to the north-east of the house, quite near the smaller lake}. "
            "They’re still in use and have a great collection of fruit and vegetables.",
            "The Temple of the Four Winds is a bit more of a walk – but it’s worth it. Take the path from the "
            "car park and go past the western sides of the stables and the house. Then {20:when the path forks, "
            "take the right-hand path. Go up there with the woods on your left and the temple is right at the "
            "end}. There are great views over the whole area.",
        ],
    },
    {
        "id": "cam21-test2-melby-coal-mine",
        "title": "Melby Coal Mine",
        "book": "Cambridge IELTS 21",
        "test": "Test 2",
        "part": "Part 2",
        "range": "15–20",
        "letters": "ABCDEFGHI",
        "image": "img/cam21-test2-melby-coal-mine.png",
        "alt": "Map of Melby Coal Mine: the car park in the south-east, the main visitor centre with the ticket "
        "office, the engine house in the west, covered walkways and buildings labelled A to I.",
        "audio": "",
        "cue": "The track is the whole of Part 2. Questions 15–20 start after Questions 13–14, when the speaker "
        "says <em>“Melby Coal Mine has been open to the public for twenty years.”</em> "
        "Before you play it, take 30 seconds to study the map: find the car park, the ticket office, the compass "
        "and the covered walkways.",
        "questions": [
            (15, "Exhibition", "F"),
            (16, "Baths", "B"),
            (17, "Tools", "D"),
            (18, "Vehicles", "A"),
            (19, "Ponies", "H"),
            (20, "Education centre", "E"),
        ],
        "transcript": [
            "Melby Coal Mine has been open to the public for twenty years and has won awards for its visitor "
            "experience. Many of the buildings around the mine are still standing and have been converted into "
            "display areas.",
            "Firstly, there’s an exhibition showing the history of the mine, with many original black and white "
            "photos. To see that, you go from the car park, via a covered walkway to the Main Visitor Centre. "
            "{15:Go through the ticket office to an area where there are lockers to leave heavy bags in, and "
            "where you can borrow raincoats. Beyond that room is the exhibition}.",
            "There’s a small bathhouse where miners used to wash after their shift underground. {16:You can see "
            "that in the building directly to the north of the engine house}. The boiler has gone from there "
            "now, but there are lines of tin baths on the stone floor.",
            "There’s a display of early mining tools from the days before mechanisation. {17:You can find that "
            "in a small L-shaped building in the middle of the northern boundary of the site}. It’s incredible "
            "to think how miners were able to use hand implements to cut through rock.",
            "The vehicle shed, where you can find wagons of different sizes, along with some of the hi-tech "
            "cutting machines that were in use until the mine closed, {18:is in the southwest corner of the "
            "site, and can be accessed via a covered walkway}.",
            "There is a field with ponies, which are always popular with children, {19:on the north-eastern "
            "boundary of the site, not approached via a covered walkway}.",
            "The other building to mention is the education centre. This is where school groups go when they "
            "visit the mine, but it’s also accessible to the public as it contains a library and small gift "
            "shop. {20:The centre is connected to the ticket office via a short section of covered walkway}.",
        ],
    },
]

TOPBAR = """<nav class="topbar" aria-label="IELTS Harper">
  <div class="topbar-inner">
    <a class="brand" href="https://ieltsharper.github.io/portal/"><span class="brand-mark" aria-hidden="true">IH</span>IELTS Harper Portal</a>
    {extra}<a class="topbar-link" href="https://ieltsharper.github.io/portal/">&larr; Back to the portal</a>
  </div>
</nav>"""

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link rel="stylesheet" href="theme.css">
  <link rel="stylesheet" href="listening.css">
</head>
<body>
"""


def letter_range(letters):
    return f"{letters[0]}–{letters[-1]}"


def page(ex):
    e = html.escape
    data = {
        "id": ex["id"],
        "title": ex["title"],
        "letters": ex["letters"],
        "audio": ex["audio"],
        "cue": ex["cue"],
        "questions": [{"n": n, "label": label, "answer": a} for n, label, a in ex["questions"]],
        "transcript": ex["transcript"],
    }
    blob = json.dumps(data, ensure_ascii=False, indent=1).replace("</", "<\\/")
    return (
        HEAD.format(title=e(f"{ex['title']} – Map labelling – IELTS Harper"))
        + TOPBAR.format(extra='<a class="topbar-link" href="./">All maps</a>\n    ')
        + f"""
<main class="container">
  <header>
    <h1>{e(ex['title'])}</h1>
    <p class="meta">{e(ex['book'])} &middot; {e(ex['test'])} &middot; Listening {e(ex['part'])} &middot; Questions {ex['range']}</p>
    <div class="instructions">
      Play the audio and choose the correct letter for each place. You hear it <strong>once</strong> in the exam,
      so try a first listen without pausing. Then press <strong>Check answers</strong>, listen again with the
      transcript, and see which words gave each answer.
    </div>
  </header>

  <section class="card audio-box" aria-labelledby="audio-title">
    <h2 class="section-title" id="audio-title">Audio</h2>
    <div id="audio"></div>
  </section>

  <section class="card" aria-labelledby="q-title">
    <h2 class="section-title" id="q-title">Questions {ex['range']}</h2>
    <p class="rubric">Label the map below.</p>
    <p class="rubric">Choose the correct letter, <strong>{letter_range(ex['letters'])}</strong>, for Questions {ex['range']}.</p>
    <h3 class="map-title">{e(ex['title'])}</h3>
    <div class="map-frame"><img src="{ex['image']}" alt="{e(ex['alt'])}"></div>
    <ol class="questions" id="questions"></ol>
    <div class="controls">
      <button type="button" class="btn-check" id="btn-check">Check answers</button>
      <button type="button" id="btn-answers">Show answers</button>
      <button type="button" class="btn-reset" id="btn-reset">Reset</button>
      <span class="score-display" id="score" aria-live="polite"></span>
    </div>
  </section>

  <section class="card transcript" aria-labelledby="t-title">
    <h2 class="section-title" id="t-title">Transcript</h2>
    <p class="locked" id="transcript-locked">Check your answers first, then the transcript opens here.</p>
    <button type="button" id="btn-transcript" hidden>Show transcript</button>
    <div id="transcript-body" hidden></div>
  </section>
</main>

<script id="exercise" type="application/json">
{blob}
</script>
<script src="listening.js"></script>
</body>
</html>
"""
    )


def index():
    rows = "\n".join(
        f'    <li><a href="{ex["id"]}.html">{html.escape(ex["title"])} '
        f'<span class="meta-inline">{html.escape(ex["book"])} &middot; {html.escape(ex["test"])} &middot; '
        f'Questions {ex["range"]}</span></a></li>'
        for ex in EXERCISES
    )
    return (
        HEAD.format(title="IELTS Listening – Map labelling – IELTS Harper")
        + TOPBAR.format(extra="")
        + f"""
<main class="container">
  <header>
    <h1>IELTS Listening: Map labelling</h1>
    <div class="summary">{len(EXERCISES)} maps from the Cambridge IELTS books</div>
    <div class="instructions">
      Choose a map. Listen and choose the letter for each place, then check your answers and read the
      transcript to see how the speaker describes the way.
    </div>
  </header>

  <ul class="menu-list">
{rows}
  </ul>
</main>
</body>
</html>
"""
    )


def main():
    for ex in EXERCISES:
        (ROOT / f"{ex['id']}.html").write_text(page(ex), encoding="utf-8", newline="\n")
    (ROOT / "index.html").write_text(index(), encoding="utf-8", newline="\n")
    print(f"Built index.html and {len(EXERCISES)} exercise pages.")


if __name__ == "__main__":
    main()
