from fastapi import FastAPI, Query
import requests
import json

app = FastAPI()

BASE_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"

def fetch_events(event_type, fromdate, todate, country, pagesize, pagenumber):
    params = {
        "eventlist": event_type,          # FL or TC
        "fromdate": fromdate,
        "todate": todate,
        "country": country,
        "pagesize": pagesize,
        "pagenumber": pagenumber
    }
    try:
        r = requests.get(BASE_URL, params=params, timeout=20)
        print(f"Fetching {event_type}: status {r.status_code}")
        if r.status_code == 204:
            print(f"No content for {event_type}")
            return []
        r.raise_for_status()
        data = r.json()
        features = data.get("features", [])
        print(f"Found {len(features)} {event_type} events")
        return features
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {event_type}: {e}")
        return []

def clean_event(feature):
    props = feature.get("properties", {})
    coords = feature.get("geometry", {}).get("coordinates", [None, None])

    return {
        "eventType": props.get("eventtype"),
        "eventId": props.get("eventid"),
        "episodeId": props.get("episodeid"),
        "name": props.get("name"),
        "description": props.get("description"),
        "alertLevel": props.get("alertlevel"),
        "country": props.get("country"),
        "fromDate": props.get("fromdate"),
        "toDate": props.get("todate"),
        "isCurrent": props.get("iscurrent"),
        "source": props.get("source"),
        "latitude": coords[1] if len(coords) > 1 else None,
        "longitude": coords[0] if len(coords) > 0 else None,
        "reportUrl": props.get("url", {}).get("report"),
        "detailsUrl": props.get("url", {}).get("details")
    }

@app.get("/latest-event")
def get_latest_event(
    fromdate: str = Query("2025-01-01"),
    todate: str = Query("2026-04-03"),
    country: str = Query("India"),
    pagesize: int = Query(10),
    pagenumber: int = Query(1)
):
    floods = fetch_events("FL", fromdate, todate, country, pagesize, pagenumber)
    cyclones = fetch_events("TC", fromdate, todate, country, pagesize, pagenumber)

    all_events = floods + cyclones
    print(f"Total events: {len(all_events)}")

    if not all_events:
        return {"message": "No recent flood or tropical cyclone found."}
    else:
        # Sort by toDate descending
        all_events.sort(
            key=lambda f: f.get("properties", {}).get("todate", ""),
            reverse=True
        )
        latest_event = clean_event(all_events[0])
        return latest_event