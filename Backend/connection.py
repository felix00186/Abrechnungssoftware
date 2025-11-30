import sqlite3
from sqlite3 import Cursor
from typing import Union, List
import os.path


db = None
cur = None
DB_PATH = "data.db"


def init_db():
    if os.path.isfile(DB_PATH):
        sql_file = None
    else:
        with open("init.sql", "r") as f:
            sql_file = f.read().split(";")
    global db, cur
    db = sqlite3.connect("data.db")
    cur = db.cursor()
    if sql_file:
        for sql in sql_file[:-1]:
            execute(sql + ";")


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
