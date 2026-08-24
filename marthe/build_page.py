# -*- coding: utf-8 -*-
"""Injecte marthe.mp3 (en base64) dans le gabarit et produit marthe.html."""
import base64, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
mp3 = os.path.join(ICI, "marthe.mp3")
if not os.path.exists(mp3):
    sys.exit("marthe.mp3 absent — lancez d'abord : python3 compose.py")

tpl = open(os.path.join(ICI, "marthe.tpl.html"), encoding="utf-8").read()
if "__AUDIO_B64__" not in tpl:
    sys.exit("marqueur __AUDIO_B64__ introuvable dans marthe.tpl.html")

html = tpl.replace("__AUDIO_B64__", base64.b64encode(open(mp3, "rb").read()).decode())
out = os.path.join(ICI, "marthe.html")
open(out, "w", encoding="utf-8").write(html)
print(f"marthe.html : {len(html.encode())/1024/1024:.2f} Mo")
