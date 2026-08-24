# Marthe ne dit pas deux fois

Gwerz en mi mineur, 66 à la noire — paroles, musique et maquette.

## Fichiers

| Fichier | Rôle |
|---|---|
| `compose.py` | La partition, en code : mélodie, accords, structure, et le moteur de synthèse (cordes pincées Karplus-Strong, voix additive, réverbe algorithmique). Produit le MIDI et l'audio. |
| `marthe.tpl.html` | Gabarit de la page-partition ; `__AUDIO_B64__` est remplacé à la construction. |
| `build_page.py` | Injecte l'audio dans le gabarit et produit `marthe.html`. |
| `marthe.mid` | 4 pistes (guitare, basse, chant) — s'ouvre dans MuseScore. |
| `marthe.mp3` | Maquette audio, 3:57. |

`marthe.wav` et `marthe.html` ne sont pas versionnés : ils se régénèrent.

## Reconstruire

```bash
pip install numpy soundfile
python3 compose.py      # -> marthe.wav, marthe.mp3, marthe.mid
python3 build_page.py   # -> marthe.html
```

## Structure du morceau

Intro 4 · Couplet 8 · Couplet 8 · Refrain 8 · Couplet 8 · Pont 12 · Refrain 8 · Final 6 · Outro 2
— soit 64 mesures.

Couplets `Em D C D`, refrain `C D Em Em / C D Em D`, pont `Am Em C D` ×3.
Capo en case 2 si la mélodie est trop grave.
