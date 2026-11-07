// The Sibyl of Cumae: guide, narrator, and the one who remembers.
// She knows this is a descent you have made before, and that you are the one playing it.
(function (RA) {
  const said = new Set();
  function pick(lines) {
    const fresh = lines.filter((l) => !said.has(l));
    const l = (fresh.length ? fresh : lines)[Math.floor(Math.random() * (fresh.length ? fresh.length : lines.length))];
    said.add(l);
    if (said.size > 60) said.clear();
    return l;
  }
  const days = (ms) => Math.floor(ms / 86400000);

  RA.Sibyl = {
    greeting(mem, prevLastSeen) {
      const h = new Date().getHours();
      if (!mem.runs) {
        return pick([
          'Facilis descensus Averno. The way down is easy. Every answer you know is a weapon; the rarer it is, the deeper it cuts.',
          'You found the cave at Cumae. I am the Sibyl. Below us the dead are waiting, and they only fear words.',
        ]);
      }
      const away = prevLastSeen ? days(Date.now() - prevLastSeen) : 0;
      if (away >= 7) return `Seven days and more. I counted. You reached Gradus ${RA.roman(mem.best)} once; the dead still talk about it.`;
      if (away >= 1) return pick([`${away === 1 ? 'A day' : away + ' days'} since your last descent. The leaves have shifted. So have the answers.`, 'You came back. They usually don’t.']);
      if (h >= 0 && h < 5) return pick(['It is very late where you are. Even the shades sleep at this hour. Not you, apparently.', 'The small hours. The best time to go down, and the worst time to come back up.']);
      if (mem.abandoned && mem.abandoned >= 2) return 'You have walked away mid-descent before. I noticed. I always notice.';
      if (mem.runs >= 10) return pick([`Descent number ${mem.runs + 1}. You are starting to sound like you belong down here.`, 'Again? Good. Words are worn smooth by use. Find new ones.']);
      return pick([`Your deepest descent: Gradus ${RA.roman(mem.best)}. Shall we go further?`, 'Hoc opus, hic labor est. Going down was never the hard part.']);
    },
    floor(enemy, floor) {
      const e = RA.ENEMIES[enemy.id];
      let l = e.line;
      if (enemy.mutated) l += ' ' + pick(['Something is wrong with this one. It has learned a second trick.', 'The deeper we go, the more they borrow from each other.', 'Look closely. The rules are changing.']);
      if (floor === 1) l = 'Gradus I. ' + l + ' Type an answer and press Enter.';
      return l;
    },
    hit(ev) {
      if (ev.tier === 5) return pick(['Rara avis! A black swan. Even I had to think about that one.', 'One in a million. The dead felt that.', 'Where did you even learn that?']);
      if (ev.tier === 4 && Math.random() < 0.5) return pick(['Rarissimus. Very good.', 'That word has not been spoken down here in a long time.']);
      if (ev.worn) return pick(['You keep saying that one. Worn words cut less.', 'Tritum. Used too often in past lives; it has lost its edge.']);
      if (ev.typo) return pick(['I knew what you meant. Spell it right and it hits harder.', 'Close enough… this once.']);
      if (ev.fed) return 'You fed her. Common words are food to a Harpy.';
      return null;
    },
    reject(ev) {
      switch (ev.reason) {
        case 'invalid': return pick(['Non accipitur. That isn’t an answer to the question.', 'No. The dead heard you hesitate.', 'Not that.']);
        case 'dup': return 'Iam dictum: you already said that this descent.';
        case 'sphinx': return `The Sphinx wants it later in the alphabet than “${ev.after}”.`;
        case 'tantalus': return `Longer. More than ${ev.len} letters. He reaches past anything shorter.`;
        case 'judge': return `Minos has already heard a word beginning with ${ev.letter}.`;
        case 'echo': return 'Echo has heard that in one of your past lives. She only repeats it back.';
        case 'toll': return ev.min === 2 ? 'Too common for the ferryman. Insolitus (uncommon) or better.' : 'Too common for the ferryman. Rarus (rare) or better.';
      }
      return null;
    },
    strike(run) {
      if (run.anima < run.maxAnima * 0.3) return pick(['Your Anima is thin. Use a leaf if you have one.', 'Careful. You are almost a shade yourself.']);
      return null;
    },
    revive() { return 'The Golden Bough. Proserpina lets you return… once.'; },
    clear(ev) {
      if (ev.boss) return pick(['It falls. I have one more leaf for you.', 'The gate is open. Deeper, then.']);
      return pick(['Choose a gift. The gods are watching, and they like to be useful.', 'Deeper. Pick a gift first.', 'Bene. The next one will be harder.']);
    },
    death(run, mem) {
      if (run.floor > mem.best) return `Gradus ${RA.roman(run.floor)}. Deeper than you have ever gone. I will remember it, even if no one else does.`;
      if (run.floor <= 2) return 'So soon. The way down is easy; staying down is not.';
      return pick(['Your shade returns to the cave mouth. Come again. Bring new words.', 'Every descent teaches the next one. Read what you missed.']);
    },
    hidden() { return pick(['You looked away. I noticed.', 'Where did you go? The shades did not wait.']); },
  };
})(window.RA = window.RA || {});
