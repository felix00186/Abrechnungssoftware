import sqlite3
from sqlite3 import Cursor
from typing import Union, List


db = sqlite3.connect("data.db")
cur = db.cursor()


def get_new_id(table: str) -> int:
    sql = f"SELECT CASE WHEN MAX(id) IS NULL THEN 0 ELSE MAX(id)+1 END FROM {table};"
    for row in get(sql):
        return row[0]


def execute(sql: Union[str, List[str]]):
    print(sql)
    if type(sql) == str:
        sql = [sql]
    for line in sql:
        cur.execute(line)
    db.commit()


def get(sql: str) -> Cursor:
    print(sql)
    return cur.execute(sql)
