from __future__ import annotations
import argparse
import json
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument("--snapshot", required=True)
args = p.parse_args()
path = next(Path(args.snapshot).rglob("ESPN_Current_Snapshot_1438350867_2026.json"))
data = json.loads(path.read_text(encoding="utf-8"))
league = data["League"][0]
current_week = int(league["current_week"])
teams = {int(t["team_id"]): t for t in data["Teams"]}
names = {
    1:"Ryan Mays",2:"Chance Robinson",3:"Louis Swanson",
    4:"Ryan Hutchins",5:"Frankie Yentz",6:"Macon Moore",
    7:"Casey Hutchins",8:"Glen Hutchins",9:"Larry Terrell",10:"Zak Wesolek"
}
details=[]
for game in data["Weekly_Matchups"]:
    week=int(game["week"])
    if week >= current_week or game.get("is_playoff"):
        continue
    home=float(game["home_score"])
    away=float(game["away_score"])
    margin=round(abs(home-away),2)
    if margin < 35:
        continue
    loser_id=int(game["home_team_id"] if home<away else game["away_team_id"])
    winner_id=int(game["away_team_id"] if home<away else game["home_team_id"])
    details.append({"Season":2026,"Week":week,"Loser":names[loser_id],
        "Winner":names[winner_id],"Loser Score":min(home,away),
        "Winner Score":max(home,away),"Margin":margin})
details.sort(key=lambda x:(x["Season"],x["Week"],x["Loser"]))
counts={name:0 for name in names.values()}
for game in details:
    counts[game["Loser"]]+=1
rows=[{"Rank":i+1,"Manager":name,"Losses":count}
    for i,(name,count) in enumerate(sorted(counts.items(),key=lambda x:(-x[1],x[0])))]
Path("blowout-losses.js").write_text(
    "window.BLOWOUT_LOSSES = "+json.dumps(rows,separators=(",",":"))+";\n"+
    "window.BLOWOUT_LOSS_DETAILS = "+json.dumps(details,separators=(",",":"))+";\n"+
    "window.BLOWOUT_SCOPE = '2026 regular season through Week '+str(current_week-1)+' (historical seasons not included)';\n",
    encoding="utf-8"
)
print(f"2026 completed through Week {current_week-1}: {len(details)} losses by 35+ points")
