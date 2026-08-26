#!/usr/bin/env python3
"""Generate the game's sound effects as small WAV files.

Everything is additive synthesis: bell-ish notes (a fundamental plus a couple of
fast-decaying partials) played on a C-major / pentatonic set, with a short
delay tail so the cues sound like a toy instrument in a small room rather than
like system beeps. Keeping the synth here means the whole palette is tweakable
in one place and each file stays a few KB. Run after editing:

    python3 tools/make-sfx.py
"""
import math
import struct
import wave
from pathlib import Path

RATE = 22050
OUT = Path(__file__).resolve().parent.parent / 'public' / 'sfx'

# Notes, C major.
N = {
    'D4': 293.66, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00,
    'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1568.00, 'A6': 1760.00,
    'C7': 2093.00,
}

# (multiple, level, how much faster this partial fades) — a soft mallet timbre.
MALLET = ((1, 1.0, 1.0), (2, 0.34, 1.7), (3, 0.12, 2.6), (4.2, 0.05, 3.4))
GLASS = ((1, 1.0, 1.0), (2.76, 0.4, 1.5), (5.4, 0.16, 2.2))


def note(freq, ms, gain=0.5, partials=MALLET, decay=4.5, attack_ms=4, bend=1.0, vibrato=0.0):
    """One struck note. `bend` glides the pitch to freq*bend across the note."""
    total = int(RATE * ms / 1000)
    attack = max(1, int(RATE * attack_ms / 1000))
    out = [0.0] * total
    for mult, level, fade in partials:
        phase = 0.0
        for i in range(total):
            t = i / total
            f = freq * mult * (1 + (bend - 1) * t)
            if vibrato:
                f *= 1 + vibrato * math.sin(2 * math.pi * 6.0 * i / RATE)
            phase += 2 * math.pi * f / RATE
            env = math.exp(-decay * fade * t) * min(1.0, i / attack)
            out[i] += math.sin(phase) * level * env
    return [s * gain for s in out]


def chord(names, ms, gain=0.34, **kw):
    layers = [note(N[n], ms, gain=gain, **kw) for n in names]
    return mix(*layers)


def noise(ms, gain=0.2, decay=6.0, seed=7):
    total = int(RATE * ms / 1000)
    state = seed
    out = []
    for i in range(total):
        state = (state * 1103515245 + 12345) & 0x7FFFFFFF
        sample = state / 0x3FFFFFFF - 1.0
        out.append(sample * gain * math.exp(-decay * i / total))
    return out


def mix(*layers):
    out = [0.0] * max(len(layer) for layer in layers)
    for layer in layers:
        for i, s in enumerate(layer):
            out[i] += s
    return out


def timeline(*placements):
    """(start_ms, samples) pairs mixed onto one track — notes may overlap and ring."""
    end = max(int(RATE * at / 1000) + len(part) for at, part in placements)
    out = [0.0] * end
    for at, part in placements:
        offset = int(RATE * at / 1000)
        for i, s in enumerate(part):
            out[offset + i] += s
    return out


def air(samples, taps=((55, 0.2), (110, 0.09))):
    """Cheap delay tail — turns a dry blip into something with a bit of room."""
    longest = max(int(RATE * ms / 1000) for ms, _ in taps)
    out = samples + [0.0] * longest
    for ms, level in taps:
        offset = int(RATE * ms / 1000)
        for i, s in enumerate(samples):
            out[offset + i] += s * level
    return out


def write(name, samples):
    peak = max(abs(s) for s in samples) or 1.0
    scale = 0.9 / peak
    frames = b''.join(
        struct.pack('<h', int(max(-1.0, min(1.0, s * scale)) * 32767)) for s in samples
    )
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(frames)
    print(f'{name + ".wav":14} {len(frames) / 1024:5.1f} KB  {len(samples) / RATE * 1000:4.0f} ms')


OUT.mkdir(parents=True, exist_ok=True)

# Countdown while memorizing — a light mallet tap.
write('tick', air(note(N['C6'], 150, gain=0.45, decay=6)))

# Countdown on the answer clock: same idea, higher and tenser.
write('hurry', air(note(N['E6'], 130, gain=0.5, decay=6, bend=1.06)))

# Cards turning face down — two notes falling, plus a little paper rustle.
write('flip', air(timeline(
    (0, note(N['C6'], 130, gain=0.4, decay=7)),
    (70, note(N['G5'], 180, gain=0.4, decay=6)),
    (0, noise(120, gain=0.1, decay=9)),
)))

# Two cards trading places — a slide-whistle glide up.
write('swap', air(timeline(
    (0, note(N['G5'], 230, gain=0.4, decay=3.5, bend=1.5, vibrato=0.012, partials=GLASS)),
    (0, noise(150, gain=0.07, decay=5, seed=21)),
)))

# Placing a card into the answer row.
write('tap', air(note(N['E6'], 110, gain=0.45, decay=7, partials=GLASS)))

# Answering starts — short two-note fanfare.
write('go', air(timeline(
    (0, note(N['G5'], 150, gain=0.45, decay=6)),
    (90, chord(['C6', 'E6'], 320, gain=0.3, decay=4)),
)))

# Round solved — rising major arpeggio landing on a ringing chord.
write('correct', air(timeline(
    (0, note(N['C5'], 200, gain=0.42, decay=6)),
    (95, note(N['E5'], 200, gain=0.42, decay=6)),
    (190, note(N['G5'], 220, gain=0.44, decay=6)),
    (285, chord(['C6', 'E6', 'G6'], 620, gain=0.26, decay=3.2)),
    (285, note(N['C7'], 300, gain=0.12, decay=5, partials=GLASS)),
)))

# Round missed — a soft cartoon "aww", not a buzzer.
write('wrong', air(timeline(
    (0, note(N['A4'], 260, gain=0.42, decay=4, bend=0.94, vibrato=0.02)),
    (150, note(N['F4'], 420, gain=0.40, decay=3.2, bend=0.92, vibrato=0.03)),
)))

# Out of hearts — a little descending tune that lands gently.
write('gameover', air(timeline(
    (0, note(N['C6'], 220, gain=0.42, decay=5)),
    (150, note(N['A5'], 220, gain=0.42, decay=5)),
    (300, note(N['F5'], 240, gain=0.42, decay=5)),
    (450, chord(['D4', 'F4', 'A4'], 900, gain=0.24, decay=2.6)),
)))

# Earned a hint or a time boost — quick sparkle up.
write('reward', air(timeline(
    (0, note(N['G5'], 120, gain=0.4, decay=8, partials=GLASS)),
    (55, note(N['C6'], 120, gain=0.4, decay=8, partials=GLASS)),
    (110, note(N['E6'], 130, gain=0.4, decay=8, partials=GLASS)),
    (165, note(N['G6'], 260, gain=0.42, decay=5, partials=GLASS)),
    (165, note(N['C7'], 200, gain=0.14, decay=6, partials=GLASS)),
)))
