import json
import pandas as pd
import requests
from typing import Dictionary, List


### trails.geojson #########################################################

def _get_sheet(name: str) -> pd.DataFrame:
    ID = "13rxIs5sPo6ZEsDwh2-SzAvyaIMim-pl352RJTNFohBw"
    url = f"https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet={name}"
    return pd.read_csv(url)


def _get_trails_records() -> List[Dictionary]:
    """Return cleaned data from the 'trails' Google Sheet in records format."""
    df = _get_sheet("trails").sort_values("id")

    # drop: rows without id or name
    dropped_df = df.dropna(subset=["id", "name"])
    if len(dropped_df) < len(df):
        print(f"Dropped: Missing id and/or name: {len(df) - len(dropped_df)}")
        df = dropped_df

    # warn: rows without description
    no_desc_count = df["description"].isnull().sum()
    if no_desc_count:
        print(f"Trails without a description: {no_desc_count}")
        df = df["description"].fillna("")

    return df.to_dict("records")


def _get_resource_map() -> Dictionary:
    """Return cleaned data from the 'resources' Google Sheet as a mapping 
    from trail_id to a list of dictionaries with 'text' and 'url' keys."""
    df = _get_sheet("resources")

    # drop: rows without trail_id, text, or url
    dropped_df = df.dropna(subset=["trail_id", "text", "url"])
    if len(dropped_df) < len(df):
        print(f"Dropped: Missing id and/or name: {len(df) - len(dropped_df)}")
        df = dropped_df
    
    return {
        trail_id: trail_resources[["text", "url"]].to_dict("records")
        for trail_id, trail_resources in df.groupby("trail_id")
    }

def generate_trails_json():
    trail_records = _get_trails_records()
    resources_map = _get_resource_map()
    for trail in trail_records:
        trail["resources"] = resources_map.get(trail["id"], [])
    return trail_records


### segments.geojson #######################################################


def _from_felt_list(flist: str) -> List[str]:
    """Convert from from Felt GEOJSON list string to python list.
        Example: (2:dover,bay_colony)  --> ["dover", "bay_colony"]"""
    return flist[flist.index(":") + 1 : -1].split(",")


def get_segments():
    STATUS_VALUES = ["paved", "stone_dust", "unofficial", "construction", "closed"]

    URL = "https://felt.com/map/Mass-Trail-Tracker-1ekkosxOSVSf0EgauxB0VA.geojson"
    segments = requests.get(URL).json()

    {feat in segments["features"]}

    for feat in segments["features"]:
        props = feat["properties"]

        # remove felt properties
        for k in list(props.keys()):
            if k.startswith("felt-"):
                props.pop(k)

        # property: hidden
        if "hidden" not in props:
            print("missing hidden")
            props["hidden"] = True


        # property: status
        if "status" not in props or props["status"] not in STATUS_VALUES:
            print("bad status")


        
        # property: trails

    return segments


with open("/Users/daniel/Downloads/trails.json", "w") as f:
    json.dump(get_trails(), f)

# with open("/Users/daniel/Downloads/segments.json", "w") as f:
#     json.dump(get_segments(), f)
