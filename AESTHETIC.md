**Aesthetic:** [Dark Academia](https://aesthetics.fandom.com/wiki/Dark_Academia)

## How the CSS expresses the aesthetic

Dark Academia takes its imagery from old libraries and lamplit rooms, so every choice below is meant to make the page feel like a printed book rather than a website.

The typefaces do the most work. Libre Caslon Display and Cormorant Garamond both
come out of eighteenth-century printing, so they carry the age the aesthetic is nostalgic for. Caslon Display has only one weight, which turned out to help:
without bold to lean on, hierarchy comes from size and spacing, exactly as it does on a title page. Centred headings and letter-spaced small capitals borrow
from printed volumes, where a running head sits across the top of every page.

Every corner radius is zero since rounded corners are the most contemporary thing a page can have and nothing here is contemporary. Cards use a hard offset
shadow, closer to ink pressed slightly off register than to modern interface depth. A lunar ornament stands where a horizontal rule would go, since printers used ornaments rather than lines.

## The JavaScript enhancement

Two switches sit in the header. The first turns the aesthetic on and remembers
the choice in `localStorage`. The second exchanges Cormorant for Georgia at a
heavier weight and removes the small capitals and drop cap. Both set an attribute on the root element and let CSS handle every visual consequence, and
both ship hidden until the script has run, so a blocked script leaves behind no control that does nothing.

The second switch is my accessibility decision. Cormorant's small x-height and light strokes are much of why it looks right, and also a real cost I chose to impose on my readers. Rather than decide for them that the look was worth the difficulty, I built a way out of it. I advocate against ableism, and this course is where I understood how much of accessibility already sits in the platform:
labelled controls, correct encoding, visible focus, and markup a screen reader can move through sensibly.

## The medium is the message

When a visitor turns Dark Academia on, not one word of my writing changes: only
the typeface, the spacing, the ornaments, and the light the page seems to sit in. Yet it reads slower and more deliberate afterward. That gap between what a
page says and how it feels is what McLuhan was pointing at, and I can now trigger it with a switch.

My degree works the same way: UCSD will hand me a piece of paper, but the paper
is not what changed me. The lectures, the deadlines, and learning from
professors like Powell are the medium, and the medium did the work. This site is a small version of that: I will submit a URL, but what I gained was learning why
a build step exists and what it takes to make an interface that does not collapse when JavaScript does.

None of this decides for the reader. Dark Academia does not override their light or dark preference, it reinterprets it, so the aesthetic has both a parchment daytime state and a lamplit one and their own setting chooses.
