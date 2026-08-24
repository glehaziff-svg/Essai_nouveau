# -*- coding: utf-8 -*-
"""
« Marthe ne dit pas deux fois »
Gwerz en mi mineur — 66 bpm, 4/4.
Genere : marthe.mid (partition MIDI) + marthe.wav / .mp3 / .ogg (maquette audio).
Synthese maison : cordes pincees (Karplus-Strong) + voix additive + reverbe.
"""
import numpy as np, soundfile as sf, struct, os

SR      = 44100
BPM     = 66
BEAT    = 60.0 / BPM
BAR     = 4 * BEAT
OUT     = os.path.dirname(os.path.abspath(__file__))
rng     = np.random.default_rng(1954)   # graine fixe -> rendu reproductible

# ----------------------------------------------------------------- accords
# voicings guitare, du grave a l'aigu (numeros MIDI)
VOICING = {
    "Em": [40, 47, 52, 55, 59, 64],
    "D":  [50, 57, 62, 66, 69],
    "C":  [48, 52, 55, 60, 64],
    "Am": [45, 52, 57, 60, 64],
}
R = 0   # silence

# --------------------------------------------------------------- structure
# melodie : (note MIDI, duree en temps).  0 = silence.
COUPLET = [
    # « Elle ne repete pas »                      Em | D
    (71,.5),(71,.5),(69,.5),(67,.5),(69,1),(R,1),   (66,4),
    # « Un mot, et c'est regle »                   C  | D
    (67,1),(64,2),(R,.5),(67,.5),                   (69,.5),(71,.5),(66,3),
    # « Le reste, elle le laisse au vent »         Em | D
    (71,.5),(71,.5),(72,.5),(71,.5),(69,.5),(67,.5),(69,1), (66,1),(64,3),
    # « il en passe assez par ici »                C  | D
    (67,.5),(67,.5),(69,.5),(67,.5),(66,.5),(64,.5),(62,1), (66,1),(64,3),
]
COUPLET_CH = ["Em","D","C","D","Em","D","C","D"]

REFRAIN = [
    # « Marthe, »                                  C
    (72,2),(71,2),
    # « tu ne gaspilles rien : »                   D
    (69,.5),(69,.5),(71,.5),(69,.5),(66,2),
    # « ni le pain, ni le temps, ni les mots. »    Em | Em
    (64,.5),(66,.5),(67,1),(R,.5),(67,.5),(69,.5),(71,.5),
    (R,.5),(71,.5),(69,.5),(67,2.5),
    # « Marthe, »                                  C
    (72,2),(71,2),
    # « je n'attends pas de belle phrase — »       D
    (69,.5),(69,.5),(71,.5),(69,.5),(67,.5),(66,.5),(67,.5),(69,.5),
    # « tu es la, et c'est deja tout. »            Em | D
    (71,.5),(69,.5),(67,1),(R,.5),(67,.5),(66,.5),(64,.5),
    (66,1),(64,3),
]
REFRAIN_CH = ["C","D","Em","Em","C","D","Em","D"]

PONT = [
    (69,.5),(69,.5),(72,.5),(71,.5),(69,1),(R,1),          # Am
    (67,.5),(67,.5),(69,.5),(67,.5),(64,2),                # Em
    (64,.5),(67,.5),(72,1),(71,1),(69,1),                  # C
    (71,1),(69,1),(66,2),                                  # D
    (69,.5),(69,.5),(72,.5),(74,.5),(72,2),                # Am
    (71,.5),(71,.5),(69,.5),(67,.5),(66,2),                # Em
    (64,.5),(67,.5),(69,1),(71,1),(72,1),                  # C
    (74,2),(71,2),                                         # D
    # « Et le lendemain, la table est mise »
    (69,.5),(69,.5),(72,.5),(72,.5),(71,.5),(69,.5),(71,1),  # Am
    (69,.5),(67,.5),(66,.5),(64,.5),(66,2),                  # Em
    # « comme si de rien n'etait. »
    (67,.5),(67,.5),(64,.5),(67,.5),(69,1),(71,1),           # C
    (66,4),                                                  # D
]
PONT_CH = ["Am","Em","C","D","Am","Em","C","D","Am","Em","C","D"]

FINAL = [
    (71,1),(69,1),(67,2),                                  # Em  « Alors je ne vais pas faire long »
    (67,.5),(64,.5),(R,1),(67,1),(69,1),                   # C   « Tu detestes ca »
    (66,2),(R,2),                                          # D
    (64,1),(R,1),(64,2),                                   # Em  « c'etait toi »
    (67,1),(69,1),(71,2),                                  # C   « et c'est encore »
    (64,4),                                                # Em  « toi »
]
FINAL_CH = ["Em","C","D","Em","C","Em"]

SILENCE4 = [(R,4)]
SILENCE8 = [(R,4),(R,4)]

FORME = [
    ("Intro",     ["Em","D","C","D"],        SILENCE4*4),
    ("Couplet 1", COUPLET_CH,                COUPLET),
    ("Couplet 2", COUPLET_CH,                COUPLET),
    ("Refrain",   REFRAIN_CH,                REFRAIN),
    ("Couplet 3", COUPLET_CH,                COUPLET),
    ("Pont",      PONT_CH,                   PONT),
    ("Refrain",   REFRAIN_CH,                REFRAIN),
    ("Final",     FINAL_CH,                  FINAL),
    ("Outro",     ["C","Em"],                SILENCE4*2),
]

# verification d'alignement : la melodie doit remplir exactement les mesures
for nom, ch, mel in FORME:
    got, want = sum(d for _, d in mel), 4 * len(ch)
    assert abs(got - want) < 1e-9, f"{nom}: {got} temps pour {want} attendus"
print("Alignement des mesures : OK")

# ------------------------------------------------------------- synthese
def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12.0)

def pluck(midi, dur, amp=1.0, damp=0.9965, bright=0.5):
    """Corde pincee (Karplus-Strong etendu)."""
    f = hz(midi)
    N = max(2, int(round(SR / f)))
    n = int(dur * SR)
    buf = rng.uniform(-1, 1, N)
    # adoucit l'attaque : moyenne glissante sur la salve initiale
    k = max(1, int(N * (1 - bright) * 0.25))
    if k > 1:
        buf = np.convolve(buf, np.ones(k) / k, mode="same")
    # un echantillon de garde en tete : la recurrence lit y[i-N-1]
    y = np.zeros(n + N + 2)
    y[1:N+1] = buf
    for i in range(N + 1, n + 1, N):
        j = min(N, n + 1 - i)
        y[i:i+j] = damp * 0.5 * (y[i-N:i-N+j] + y[i-N-1:i-N-1+j])
    y = y[1:n+1]
    y *= np.exp(-np.linspace(0, 2.6, n))          # extinction naturelle
    return y * amp

def voix(midi, dur, amp=1.0):
    """Ligne de chant : additif + vibrato retarde + enveloppe douce."""
    n = int(dur * SR)
    if n <= 0:
        return np.zeros(0)
    t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - .18) / .35, 0, 1)
    ph = 2 * np.pi * hz(midi) * np.cumsum(vib) / SR
    y = (np.sin(ph) + .38 * np.sin(2 * ph) + .16 * np.sin(3 * ph)
         + .07 * np.sin(4 * ph) + .03 * np.sin(5 * ph))
    a, r = int(.07 * SR), int(.22 * SR)
    env = np.ones(n)
    a, r = min(a, n // 2), min(r, n // 2)
    env[:a] = np.linspace(0, 1, a) ** 1.6
    env[n-r:] = np.linspace(1, 0, r) ** 1.4
    env *= np.exp(-t * .35)
    return y * env * amp * .28

def comb(x, delay, gain):
    y = x.copy()
    for i in range(delay, len(y), delay):
        j = min(delay, len(y) - i)
        y[i:i+j] += gain * y[i-delay:i-delay+j]
    return y

def reverbe(x, mix=.28):
    """Reverbe algorithmique : 4 peignes en parallele + 2 passe-tout."""
    w = np.zeros_like(x)
    for ms, g in ((41.3, .78), (48.7, .75), (57.1, .72), (63.9, .70)):
        w += comb(x, int(SR * ms / 1000), g)
    w /= 4
    for ms, g in ((5.1, .7), (1.7, .7)):
        d = int(SR * ms / 1000)
        w = comb(w, d, -g)
    w = np.convolve(w, np.ones(60) / 60, mode="same")   # assombrit la queue
    return (1 - mix) * x + mix * w * .9

# ------------------------------------------------------- rendu du morceau
n_bars = sum(len(ch) for _, ch, _ in FORME)
total  = int((n_bars * BAR + 5) * SR)
gtr    = np.zeros(total)
bass   = np.zeros(total)
lead   = np.zeros(total)

def pose(piste, t, sig):
    i = int(t * SR)
    j = min(len(piste), i + len(sig))
    piste[i:j] += sig[:j-i]

# arpege aux doigts : 8 croches par mesure
MOTIF = [0, 3, 1, 4, 2, 5, 1, 4]
ACCENT = [1.0, .55, .72, .5, .8, .5, .68, .48]

t_bar = 0.0
midi_events = []            # (piste, note, t_debut, duree, velocite)
for nom, chords, mel in FORME:
    for b, ch in enumerate(chords):
        v = VOICING[ch]
        t0 = t_bar + b * BAR
        # basse : fondamentale sur 1, quinte sur 3
        pose(bass, t0,             pluck(v[0] - 12, 3.4, .50, damp=.9975, bright=.25))
        pose(bass, t0 + 2 * BEAT,  pluck(v[1] - 12, 2.2, .28, damp=.9975, bright=.25))
        midi_events.append((1, v[0] - 12, t0, BAR * .9, 72))
        for k, idx in enumerate(MOTIF):
            note = v[min(idx, len(v) - 1)]
            t = t0 + k * BEAT / 2
            pose(gtr, t, pluck(note, 2.6, .30 * ACCENT[k], damp=.9968, bright=.55))
            midi_events.append((0, note, t, BEAT * .55, int(52 + 34 * ACCENT[k])))
    t_bar += len(chords) * BAR

# melodie
t = 0.0
sect_start, i = 0.0, 0
for nom, chords, mel in FORME:
    t = sect_start
    for note, dur in mel:
        if note != R:
            d = dur * BEAT
            pose(lead, t, voix(note, d + .45, 1.0))
            midi_events.append((2, note, t, d * .92, 88))
        t += dur * BEAT
    sect_start += len(chords) * BAR

# ----------------------------------------------------------- mixage stereo
def norm(x, peak):
    m = np.max(np.abs(x))
    return x / m * peak if m > 0 else x

gtr, bass, lead = norm(gtr, .55), norm(bass, .45), norm(lead, .60)
gtr  = reverbe(gtr,  .30)
lead = reverbe(lead, .34)
bass = reverbe(bass, .12)

# placement : guitare legerement a gauche, chant au centre, basse centree
L = .62 * gtr + .5 * bass + .70 * lead
Rr = .46 * gtr + .5 * bass + .70 * lead
mix = np.stack([L, Rr], axis=1)
mix = np.tanh(mix * 1.15) * .92          # saturation douce
mix = mix / np.max(np.abs(mix)) * .89

# fondu d'entree et de sortie
fi, fo = int(.35 * SR), int(3.2 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= (np.linspace(1, 0, fo) ** 1.7)[:, None]

sf.write(f"{OUT}/marthe.wav", mix, SR, subtype="PCM_16")
sf.write(f"{OUT}/marthe.mp3", mix, SR)

# --------------------------------------------------------------- fichier MIDI
def vlq(n):
    out = [n & 0x7F]; n >>= 7
    while n:
        out.insert(0, (n & 0x7F) | 0x80); n >>= 7
    return bytes(out)

TPQ = 480
def piste(events, canal, programme, nom):
    data = bytearray()
    data += b"\x00\xFF\x03" + vlq(len(nom)) + nom.encode()
    data += b"\x00" + bytes([0xC0 | canal, programme])
    braw = []
    for _, note, t0, dur, vel in events:
        braw.append((t0 / BEAT * TPQ, 0x90 | canal, note, vel))
        braw.append(((t0 + dur) / BEAT * TPQ, 0x80 | canal, note, 0))
    braw.sort(key=lambda e: (e[0], e[1] & 0xF0))
    prev = 0
    for tick, status, note, vel in braw:
        tk = int(round(tick))
        data += vlq(max(0, tk - prev)) + bytes([status, note, vel]); prev = tk
    data += b"\x00\xFF\x2F\x00"
    return b"MTrk" + struct.pack(">I", len(data)) + bytes(data)

tempo = int(60_000_000 / BPM)
meta = bytearray(b"\x00\xFF\x03\x1BMarthe ne dit pas deux fois")
meta += b"\x00\xFF\x51\x03" + tempo.to_bytes(3, "big")
meta += b"\x00\xFF\x58\x04\x04\x02\x18\x08"       # 4/4
meta += b"\x00\xFF\x59\x02\x01\x01"               # 1 diese, mineur -> mi mineur
meta += b"\x00\xFF\x2F\x00"
trk0 = b"MTrk" + struct.pack(">I", len(meta)) + bytes(meta)

g  = [e for e in midi_events if e[0] == 0]
bs = [e for e in midi_events if e[0] == 1]
ld = [e for e in midi_events if e[0] == 2]
midi = (b"MThd" + struct.pack(">IHHH", 6, 1, 4, TPQ) + trk0
        + piste(g, 0, 24, "Guitare")        # nylon
        + piste(bs, 1, 32, "Basse")         # acoustic bass
        + piste(ld, 2, 53, "Chant"))        # voice oohs
open(f"{OUT}/marthe.mid", "wb").write(midi)

dur = len(mix) / SR
print(f"Duree : {int(dur//60)}:{int(dur%60):02d}  ({n_bars} mesures)")
for f in ("marthe.wav", "marthe.mp3", "marthe.mid"):
    print(f"  {f:12s} {os.path.getsize(f'{OUT}/{f}')/1024:8.0f} Ko")
