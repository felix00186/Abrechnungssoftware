from datetime import datetime
from typing import Union, List, Tuple


def trim_string(s: str) -> str:
    s = s.replace("'", "''")
    return s


def parse_datum(d: str, u: Union[str, None]=None) -> Union[str, None]:
    try:
        geb = [int(s) for s in d.replace(" ", "").split(".")]
        geb.reverse()
        datetime(*geb)
        geb_str = [str(i) for i in geb]
        for i in range(1, 3):
            if len(geb_str[i]) == 1:
                geb_str[i] = "0" + geb_str[i]
        geb_str = "-".join(geb_str)
        if u is None:
            return "DATETIME('{}')".format(geb_str)
        try:
            u = u.replace(" ", "").split(":")
            u = [int(s) for s in u]
            datetime(*geb, *u, 0)
            u = [str(i) for i in u]
            for i in range(2):
                if len(u[i]) == 1:
                    u[i] = "0" + u[i]
            u.append("00")
            u = ":".join(u)
            return f"DATETIME('{geb_str} {u}')"
        except Exception as e:
            print(e.with_traceback(None))
            return "DATETIME('{}')".format(geb_str)
    except:
        return "null"


def format_datum(d: str) -> Tuple[str, str, datetime]:
    d = d.replace("-", " ").replace(":", " ").split(" ")
    d_int = [int(s) for s in d]
    for i in range(len(d)):
        if len(d[i]) < 2:
            d[i] = "0" + d[i]
    datum = f"{d[2]}.{d[1]}.{d[0]}"
    uhr = f"{d[3]}:{d[4]}"
    if uhr == "00:00":
        uhr = None
    d_int = datetime(*d_int)
    return datum, uhr, d_int
