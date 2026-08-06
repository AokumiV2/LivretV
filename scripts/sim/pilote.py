"""Pilote de vérification hors navigateur.

Dans le site, le code de l'élève tourne dans Pyodide et le pont vers
le simulateur est un objet JavaScript. Ici, le même code tourne dans
le CPython de la machine et le pont passe par l'entrée standard.

Le shim rclpy, lui, est strictement identique : c'est justement ce
qu'on veut vérifier. Node reste maître de la boucle et de la
physique ; ce script ne fait qu'exécuter Python et rapporter ce qui
en sort.

Protocole, une ligne JSON par message :

  <- {"c": "exec", "src": "..."}        -> {"r": "<json de executer>", ...}
  <- {"c": "step", "t": 1.23,
      "msgs": [[cb, type, charge], ...],
      "srv":  [[appel, cb, requete], ...]}
                                        -> {"err": ..., "emits": [...],
                                            "logs": [...], "news": {...}}
  <- {"c": "fin"}                       -> {"snap": "<json>"}
"""

import json
import sys
import types

# ---------------------------------------------------------------
# Le pont, injecté comme module avant l'import du shim.
# ---------------------------------------------------------------

_pont = types.ModuleType("_pont")

ETAT = {
    "t": 0.0,
    "suivant": 1,
    "entrants": [],
    "srv": [],
    "emis": [],
    "logs": [],
    "news": {"pubs": [], "subs": [], "srvs": [], "timers": [], "nodes": []},
    "reponses": [],
}


def _now():
    return ETAT["t"]


def _log(node, niveau, texte):
    ETAT["logs"].append([niveau, node, texte])


def _id():
    i = ETAT["suivant"]
    ETAT["suivant"] += 1
    return i


def _pub_new(node, topic, type_, rel, dur, depth):
    i = _id()
    ETAT["news"]["pubs"].append([i, node, topic, type_, rel, dur, depth])
    return i


def _sub_new(node, topic, type_, rel, dur, depth, cb):
    i = _id()
    ETAT["news"]["subs"].append([i, node, topic, type_, rel, dur, depth, cb])
    return i


def _srv_new(node, nom, type_, cb):
    ETAT["news"]["srvs"].append([node, nom, cb])
    return cb


def _node_new(nom):
    ETAT["news"]["nodes"].append(nom)


def _timer(node, periode):
    ETAT["news"]["timers"].append([node, periode])


def _emit(pid, charge):
    ETAT["emis"].append([pid, charge])


def _sub_count(topic):
    return len([s for s in ETAT["news"]["subs"] if s[2] == topic])


def _harvest():
    if not ETAT["entrants"]:
        return "[]"
    out = json.dumps(ETAT["entrants"])
    ETAT["entrants"] = []
    return out


def _srv_pending():
    if not ETAT["srv"]:
        return "[]"
    out = json.dumps(ETAT["srv"])
    ETAT["srv"] = []
    return out


def _srv_reply(appel, charge):
    ETAT["reponses"].append([appel, charge])


_pont.now = _now
_pont.log = _log
_pont.pub_new = _pub_new
_pont.sub_new = _sub_new
_pont.srv_new = _srv_new
_pont.node_new = _node_new
_pont.timer = _timer
_pont.emit = _emit
_pont.sub_count = _sub_count
_pont.harvest = _harvest
_pont.srv_pending = _srv_pending
_pont.srv_reply = _srv_reply

sys.modules["_pont"] = _pont

import _livretv.core as core  # noqa: E402


def vider():
    sortie = {
        "emits": ETAT["emis"],
        "logs": ETAT["logs"],
        "news": ETAT["news"],
    }
    ETAT["emis"] = []
    ETAT["logs"] = []
    ETAT["news"] = {"pubs": [], "subs": [], "srvs": [], "timers": [], "nodes": []}
    return sortie


def repondre(objet):
    sys.stdout.write(json.dumps(objet) + "\n")
    sys.stdout.flush()


def principal():
    for ligne in sys.stdin:
        ligne = ligne.strip()
        if not ligne:
            continue
        m = json.loads(ligne)

        if m["c"] == "exec":
            ETAT["t"] = 0.0
            r = core.executer(m["src"])
            sortie = vider()
            sortie["r"] = r
            repondre(sortie)

        elif m["c"] == "step":
            ETAT["t"] = m["t"]
            ETAT["entrants"] = m.get("msgs") or []
            ETAT["srv"] = m.get("srv") or []
            err = core.pas(m["t"])
            sortie = vider()
            sortie["err"] = err
            repondre(sortie)

        elif m["c"] == "fin":
            core.finaliser()
            repondre({"snap": core.instantane()})

        elif m["c"] == "stop":
            return


if __name__ == "__main__":
    principal()
