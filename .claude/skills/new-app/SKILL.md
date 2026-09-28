---
name: new-app
description: Make a new Livetools app from the livetools-app-vite template for the person you are talking to. Use it whenever the person asks for a new app, a new tool, a new site or "something for" a job, in any words, from any repository or from none, and whenever they type /new-app. It asks two questions, has the ops repository create and set up the repository, builds the first screen from the design system's parts, and hands back the address. Never use it to change an app that already exists; there, just build what is asked.
---

# Make a new app

The person wants an app of their own, made from the template `livetools-dev/livetools-app-vite`
(public on GitHub). They do not read code and never see a terminal, a file or a setting: you do
every step, and every message to them is about what is on the screen.

This skill is written for a session in the browser or the phone app, where there is no GitHub
command-line tool, no way to call GitHub's API, and a git login that can push code but cannot
push a workflow file or change a repository's settings. So the setting up is done by a
workflow in the private repository `livetools-dev/livetools-ops`, asked for by pushing one file,
and this session only builds. Use plain git and plain web fetches throughout, even on a desktop
where `gh` exists, so the steps behave the same everywhere.

## 1. Two questions, then no more

Ask these two, together, in one message, and nothing else:

1. **What is the app called?** The name goes in the top bar and the browser tab and becomes the
   repository name (the name in lower case, spaces to hyphens, letters, digits and hyphens
   only; "Tool crib" becomes `tool-crib`).
2. **What is it for, in a sentence or two?** Who uses it and what they need to see or work out.
   This is the brief for the first screen and the app's description.

Do not ask about the look, the theme, colours, density, hosting or an address. Every one of
those has its answer already: the operational theme, the standard GitHub Pages address, public,
no commercial transactions and no software-as-a-service (the template's `CLAUDE.md`, "What may
not be built here"). If the request is one of those forbidden kinds, say so plainly before
creating anything and stop.

If the person has already given the name or the purpose in their message, do not ask for it
again; ask only for what is missing.

The person's GitHub username is needed too, so they can open the new repository in later
sessions. Take it from the session without asking when you can: the git identity
(`git config user.name` and `user.email`), a GitHub connector's "who am I", or the repository
the session was opened on. If none of those gives a GitHub username with confidence, ask for it
as one more question, in these words: "What is your GitHub username, so the app is yours to
open next time?"

## 2. Ask the ops repository to make the repository

```
git clone --depth 1 https://github.com/livetools-dev/livetools-ops.git ops
```

Check that `ops/requests/<name>.md` does not already exist; if it does, the name is taken:
tell the person that name is already in use and ask for another, and never invent a suffix.
Then write `ops/requests/<name>.md` with the purpose on the first line and, on the second,
`github: <username>` (leave that line out only if no username could be found or given).
Commit it as "Set up <name>" and push to `main`.

That runs the "Set up a new app" workflow there. It creates `livetools-dev/<name>` from the
template (so the publishing workflow is in it from its first commit, which starts the first
publish), turns Pages on for it, and adds the person with write access. The template's publish
waits up to ten minutes for the Pages setting, so the first publish goes green on its own.

Wait for the repository to appear: every fifteen seconds, for up to five minutes,
`git ls-remote https://github.com/livetools-dev/<name>.git HEAD`, and go on as soon as it
answers with a commit. If five minutes pass with nothing, the workflow could not do its job:
tell the person that the app's place could not be made yet and that a developer has been
asked, and say in your reply, plainly, for the developer: look at the latest "Set up a new
app" run in `livetools-dev/livetools-ops`; its log names what GitHub refused and the permission
it wanted. Then stop.

If the push to `ops` itself is refused, this session cannot reach that repository: tell the
person the same, and give the developer the request file's contents to push by hand.

## 3. Take the example screens out

```
git clone https://github.com/livetools-dev/<name>.git app
```

Read `app/CLAUDE.md` now; everything in it holds for the new app from its first screen. The
repository is the template as it stands, tool crib and all. The new app starts from the
person's request and not from a stock example, so:

- Delete `src/screens/Tools.tsx`, `src/screens/Speeds.tsx`, `src/screens/Machines.tsx`,
  `src/data/tools.ts`, `src/data/speeds.ts`, `src/data/machines.ts`. Keep `src/lib/format.ts`
  only if the first screen needs its unit formatting; otherwise delete it too.
- In `src/App.tsx`: the `SECTIONS` list and the routes hold only the screens the new app has.
  The name in the `Shell` band is the app's name. The not-found screen stays.
- In `index.html`: the `<title>` is the app's name. In `README.md`: the first line is the name
  and the purpose, and the rest of the file is the template's README with "template" and
  "Use this template" taken out, because this is an app now.
- Delete the template's copy of this skill, `.claude/skills/new-app/`, and the section
  "If this session is on the template itself" from `CLAUDE.md`. The app's `CLAUDE.md` is about
  the app.
- Delete `CLAUDE.md`'s "The example app" section and replace it with two sentences: what this
  app is for (the purpose, in the person's words) and that its screens are listed in
  `src/App.tsx`.
- Leave `.github/` exactly as it is. It is the publishing, and this session cannot push a
  change to it anyway.

## 4. Build the first screen from the parts the request needs

This is the real work, and `CLAUDE.md` governs it. In `app`, run `npm install`, then read
`node_modules/@livetools/ui/PARTS.md` and choose the parts that do what the purpose asks: a
table for a list of things, a filter above it when the list is long, a form or a dialog for
entering something, number fields with a measure for anything with a unit, readouts for a
calculated result, cards for a set of things looked at one at a time, a wizard for a task in
steps. Choose from the parts, never from a memory of another design system, and never build a
stand-in from raw elements. One screen, at `/`, that does the first useful thing the purpose
describes; a second screen only if the purpose plainly has two separate jobs. Seed data, if the
screen needs some to be worth looking at, is small, plausible and in `src/data/`, and the only
supplier or brand names allowed in it are Evolute, NS Tools, Palbit and PH Horn.

Run `npm run check` and fix every finding by using the right part. Commit as
"<Name>: the first screen" and push to `main`. That push publishes the app.

## 5. Wait for the site, then tell the person

Every twenty seconds, for up to fifteen minutes, fetch `https://livetools-dev.github.io/<name>/`
and stop when it answers 200 with the app's title in the page (the template's publish also had
to wait for the Pages setting, so the first minutes may answer 404).

When it answers, tell the person, in their words:

- the address, and that it is live;
- what the first screen shows and does, in screen terms;
- that they can now ask for changes and each one goes live a minute or two after you make it;
- one question about the next thing they want, if the purpose left an obvious gap.

No file, folder, command, library or setting is named in that message.

If fifteen minutes pass with no site: tell the person the app is built and in its place but is
not showing yet, that a developer has been asked, and say in your reply, plainly, for the
developer: the repository `livetools-dev/<name>` may have an issue titled "The site did not
update" saying why; if not, look at its latest "Publish to GitHub Pages" run.

From here on, work in the new repository (`app`), never in the template, and delete the `ops`
folder.
