#!/usr/bin/env python3
"""Fails unless a centred element lies wholly inside the app's window, at
its centre.

    maestro hierarchy | python3 e2e/fold/assert-on-screen.py onboarding-title-1

Reads Maestro's UI hierarchy (JSON) on stdin and checks the bounds of the
element whose resource id (React Native testID) is given against the bounds
of the app's content view (android:id/content). Catches a pager left between
two pages after a fold, which "is it visible" alone does not.
"""
import json
import re
import sys

target = sys.argv[1]
text = sys.stdin.read()
tree = json.loads(text[text.index("{"):])


def bounds(node):
    found = re.findall(r"-?\d+", node.get("attributes", {}).get("bounds", ""))
    return tuple(map(int, found)) if len(found) == 4 else None


def find(node, resource_id):
    if node.get("attributes", {}).get("resource-id") == resource_id:
        return node
    for child in node.get("children", []):
        hit = find(child, resource_id)
        if hit:
            return hit
    return None


window = find(tree, "android:id/content")
element = find(tree, target)
if not window or not element:
    sys.exit(f"{target}: not found (window found: {bool(window)})")
wl, wt, wr, wb = bounds(window)
el, et, er, eb = bounds(element)
if el < wl or er > wr:
    sys.exit(f"{target}: [{el},{er}] is outside the window [{wl},{wr}]")
# The page titles are centred: a pager stopped between two pages moves them
# off the window's centre even while they stay inside it
offset = (el + er) / 2 - (wl + wr) / 2
if abs(offset) > 4:
    sys.exit(f"{target}: centre is {offset:+.0f} px off the window's centre")
print(f"{target}: on screen and centred ([{el},{er}] in [{wl},{wr}], {offset:+.0f} px)")
