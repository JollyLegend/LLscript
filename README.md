# Lakers Lodge Script Viewer

A responsive screenplay viewer designed for rehearsals on phones, tablets and computers.

## The only file you normally edit

Replace or edit:

```text
script.txt
```

The viewer reads that file automatically. Keep it in the same folder as `index.html`.

The included `script.txt` is the current rehearsal script.

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload all files from this folder to the repository root.
3. Open the repository **Settings**.
4. Open **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select the `main` branch and `/ (root)`.
7. Save.

GitHub will show the Pages address once it is deployed.

## Updating the script

Open `script.txt` on GitHub, press the pencil icon, make the changes and commit them.

You can also replace `script.txt` with a newer exported text file. The filename must stay exactly:

```text
script.txt
```

Refresh the webpage after GitHub Pages finishes updating.

## Formatting supported

The parser recognises:

- `INT.` and `EXT.` scene headings
- UPPERCASE character cues
- Dialogue beneath character cues
- Parentheticals such as `(quietly)`
- Ordinary action paragraphs
- Italic notes enclosed in `*asterisks*`
- Metadata at the top such as `Title:`, `Author:` and `Revision:`

## Character colours

- **Leon:** burgundy, reflecting his jumper and connection to the house
- **Jane:** cool blue, reflecting her more observant and grounding presence

The colours are defined near the top of `styles.css`:

```css
--leon: #8f2f4c;
--jane: #397ea8;
```

## Included rehearsal features

- Responsive phone layout
- Sticky scene headings on mobile
- Scene dropdown and desktop scene list
- Leon-only or Jane-only line focus
- Hide/show directions
- Adjustable text size
- Light and dark themes
- Print-friendly layout
- Local `.txt` preview without uploading it first

## Privacy

A standard GitHub Pages site is public. Do not publish the script there unless you are comfortable with anyone who has the link being able to read it.
