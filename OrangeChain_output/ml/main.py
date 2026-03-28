"""
KISAAN RADAR — Orange Economy Intelligence Platform
FastAPI Backend v2.0

Endpoints:
  GET /predict            → price prediction + sell recommendation for one market
  GET /forecast           → 7-day rolling price forecast with trend
  GET /compare-markets    → all markets ranked by net profit after transport
  GET /storage-optimizer  → optimal hold days vs sell now
  GET /historical         → historical prices + volume for charts
  GET /demand-signal      → oversupply / undersupply signal
  GET /markets            → list all available markets
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional
import warnings
warnings.filterwarnings('ignore')

app = FastAPI(title="ORANGE CHAIN — Orange Intelligence API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

model        = joblib.load("weights/model_all_v.pkl")
feature_cols = joblib.load("weights/feature_cols_m.pkl")
ohe_market   = joblib.load("weights/market_ohe.pkl")
le_district  = joblib.load("weights/district_le.pkl")

df = pd.read_csv("Dataset/new_orange.csv")
df['Date'] = pd.to_datetime(df['Date'], format='mixed')
df = df.sort_values(['market', 'Date']).reset_index(drop=True)
from agent import agent_router
app.include_router(agent_router)
MARKET_DISTANCES = {
    "Nagpur APMC": 0,
    "Hingna APMC": 15,
    "Kamthi APMC": 35,
    "Narkhed APMC": 70,
    "Varud APMC": 90,
    "Varud(Rajura Bazar) APMC": 95,
    "Chandrapur(Ganjwad) APMC": 115,
    "Amrawati(Frui & Veg. Market) APMC": 155,
    "Jalgaon APMC": 460,
    "Chattrapati Sambhajinagar APMC": 490,
    "Ahmednagar APMC": 520,
    "Rahuri APMC": 540,
    "Rahata APMC": 550,
    "Shrirampur APMC": 545,
    "Vadgaonpeth APMC": 530,
    "Nasik APMC": 600,
    "Pune APMC": 590,
    "Pune(Moshi) APMC": 585,
    "Sangli(Phale, Bhajipura Market) APMC": 700,
    "Kalyan APMC": 840,
    "Mumbai APMC": 870,
    "Mumbai- Fruit Market APMC": 875,
}

TRANSPORT_COST_PER_KM_PER_QUINTAL = 0.8
STORAGE_COST_PER_QUINTAL_PER_DAY  = 200.0  # ₹2/kg/day standard cold storage


def get_history(market_name: str, n: int = 20) -> Optional[pd.DataFrame]:
    mdf = df[df['market'] == market_name].sort_values('Date')
    
    return mdf.tail(n) if len(mdf) >= 3 else None


def build_features(market_name: str, pred_date: datetime,
                   working_df: pd.DataFrame = None) -> Optional[pd.DataFrame]:
    history = working_df if working_df is not None else get_history(market_name)
    if history is None or len(history) < 3:
        return None

    last, second, third = history.iloc[-1], history.iloc[-2], history.iloc[-3]

    vol_mean       = history['arrival_quantity'].tail(10).mean()
    vol_ratio      = last['arrival_quantity'] / vol_mean if vol_mean > 0 else 1.0
    price_momentum = float(last['modal_price']) - float(third['modal_price'])
    modal_ma7      = history['modal_price'].tail(7).mean()
    volume_ma7     = history['arrival_quantity'].tail(7).mean()
    price_spread   = float(last['max_price']) - float(last['min_price'])

    district = history['district_original'].iloc[-1] if 'district_original' in history.columns else 'Nagpur'
    try:
        district_enc = int(le_district.transform([district])[0])
    except Exception:
        district_enc = 0

    base = {
        'arrival_quantity': float(last['arrival_quantity']),
        'month_sin':        np.sin(2 * np.pi * pred_date.month / 12),
        'month_cos':        np.cos(2 * np.pi * pred_date.month / 12),
        'lag1_modal':       float(last['modal_price']),
        'lag2_modal':       float(second['modal_price']),
        'lag3_modal':       float(third['modal_price']),
        'volume_ratio':     float(vol_ratio),
        'lag1_volume':      float(last['arrival_quantity']),
        'lag2_volume':      float(second['arrival_quantity']),
        'modal_ma7':        float(modal_ma7),
        'volume_ma7':       float(volume_ma7),
        'price_spread':     float(price_spread),
        'price_momentum':   float(price_momentum),
        'district_encoded': district_enc,
    }

    row_df = pd.DataFrame([base])
    ohe_cols = pd.DataFrame(
        ohe_market.transform([[market_name]]),
        columns=ohe_market.get_feature_names_out(['market'])
    )
    row_df = pd.concat([row_df, ohe_cols], axis=1)

    for col in feature_cols:
        if col not in row_df.columns:
            row_df[col] = 0.0

    return row_df[feature_cols].astype(float)


def predict_price(market_name: str, pred_date: datetime,
                  working_df: pd.DataFrame = None) -> Optional[dict]:
    feat = build_features(market_name, pred_date, working_df)
    if feat is None:
        return None
    p = model.predict(feat)[0]
    return {
        "min_price":   round(float(p[0])),
        "modal_price": round(float(p[1])),
        "max_price":   round(float(p[2])),
    }


def demand_signal(market_name: str) -> dict:
    history = get_history(market_name, 15)
    if history is None:
        return {"pressure": "UNKNOWN", "signal": "GREY",
                "advice": "Insufficient data", "vol_ratio": 0, "price_momentum": 0}

    vol_mean       = history['arrival_quantity'].mean()
    latest_vol     = float(history.iloc[-1]['arrival_quantity'])
    vol_ratio      = latest_vol / vol_mean if vol_mean > 0 else 1.0
    price_momentum = float(history.iloc[-1]['modal_price']) - float(history.iloc[-3]['modal_price'])

    if vol_ratio > 1.5 and price_momentum < -200:
        return {"pressure": "OVERSUPPLY", "signal": "RED",
                "advice": "Market flooded. High arrivals + falling prices. Sell elsewhere or hold.",
                "vol_ratio": round(vol_ratio, 2), "price_momentum": round(price_momentum)}
    elif vol_ratio < 0.6 and price_momentum > 200:
        return {"pressure": "UNDERSUPPLY", "signal": "GREEN",
                "advice": "Low supply, prices rising. Excellent time to sell.",
                "vol_ratio": round(vol_ratio, 2), "price_momentum": round(price_momentum)}
    else:
        return {"pressure": "BALANCED", "signal": "YELLOW",
                "advice": "Stable market. Sell if storage costs are mounting.",
                "vol_ratio": round(vol_ratio, 2), "price_momentum": round(price_momentum)}


def get_transport_cost(market_name: str) -> float:
    dist = MARKET_DISTANCES.get(market_name, 500)
    return round(dist * TRANSPORT_COST_PER_KM_PER_QUINTAL, 2)



@app.get("/predict")
def predict(
    market: str = Query(default="Nagpur APMC"),
    date:   str = Query(default=None, description="YYYY-MM-DD, defaults to today")
):
    """
    Price prediction + demand signal + sell recommendation for one market.
    Output: Expected price, net price after transport, RED/YELLOW/GREEN signal.
    """
    pred_date = datetime.strptime(date, "%Y-%m-%d") if date else datetime.today()
    prices    = predict_price(market, pred_date)

    if prices is None:
        raise HTTPException(404, f"Insufficient data for: {market}")

    signal   = demand_signal(market)
    t_cost   = get_transport_cost(market)
    net      = prices['modal_price'] - t_cost

    if signal['signal'] == 'GREEN':
        recommendation = "SELL NOW"
    elif signal['signal'] == 'RED':
        recommendation = "HOLD OR REROUTE"
    else:
        recommendation = "SELL IF NEEDED"

    return {
        "market":           market,
        "date":             pred_date.strftime("%Y-%m-%d"),
        "currency":         "INR per Quintal",
        "predicted_prices": prices,
        "retail_per_kg":    round(prices['modal_price'] / 100, 2),
        "transport_cost":   t_cost,
        "net_price":        round(net),
        "demand_signal":    signal,
        "recommendation":   recommendation,
    }

@app.get("/forecast")
def forecast(
    market: str = Query(default="Nagpur APMC"),
    days:   int = Query(default=7, ge=1, le=30)
):
    """
    Rolling N-day price forecast.
    Each day's prediction feeds back as lag for the next day.
    Returns trend direction + best sell day.
    """
    history = get_history(market, 20)
    if history is None:
        raise HTTPException(404, f"No data for: {market}")

    working  = history.copy()
    base_dt  = working.iloc[-1]['Date']
    results  = []
    prices   = []

    for day in range(1, days + 1):
        pred_date = base_dt + timedelta(days=day)
        p = predict_price(market, pred_date, working)
        if p is None:
            break

        prices.append(p['modal_price'])
        results.append({
            "day":         day,
            "date":        pred_date.strftime("%Y-%m-%d"),
            "min_price":   p['min_price'],
            "modal_price": p['modal_price'],
            "max_price":   p['max_price'],
            "type":        "predicted"
        })

        # Feed prediction back
        new_row                    = working.iloc[-1].copy()
        new_row['Date']            = pred_date
        new_row['modal_price']     = p['modal_price']
        new_row['min_price']       = p['min_price']
        new_row['max_price']       = p['max_price']
        working = pd.concat([working, pd.DataFrame([new_row])], ignore_index=True)

    if not prices:
        raise HTTPException(500, "Forecast failed")

    trend      = "INCREASING" if prices[-1] > prices[0] else \
                 "DECREASING" if prices[-1] < prices[0] else "STABLE"
    best_day   = int(np.argmax(prices)) + 1
    peak_price = int(max(prices))

    sell_advice = (
        f"Wait. Prices rising. Best sell day: Day {best_day} (₹{peak_price}/quintal expected)"
        if trend == "INCREASING" else
        "Sell now. Prices declining over the forecast window."
        if trend == "DECREASING" else
        "Stable prices. Sell at your convenience."
    )

    return {
        "market":      market,
        "days":        days,
        "trend":       trend,
        "best_day":    best_day,
        "peak_price":  peak_price,
        "sell_advice": sell_advice,
        "forecast":    results,
    }



@app.get("/compare-markets")
def compare_markets(date: str = Query(default=None)):
    """
    All markets ranked by net price after transport.
    Answers: where should I sell today?
    Includes % profit vs Nagpur baseline.
    """
    pred_date    = datetime.strptime(date, "%Y-%m-%d") if date else datetime.today()
    all_markets  = df['market'].unique().tolist()
    results      = []
    nagpur_modal = None

    for market in all_markets:
        prices = predict_price(market, pred_date)
        if prices is None:
            continue

        signal   = demand_signal(market)
        t_cost   = get_transport_cost(market)
        net      = prices['modal_price'] - t_cost
        distance = MARKET_DISTANCES.get(market, 999)

        if market == "Nagpur APMC":
            nagpur_modal = prices['modal_price']

        results.append({
            "market":         market,
            "modal_price":    prices['modal_price'],
            "min_price":      prices['min_price'],
            "max_price":      prices['max_price'],
            "transport_cost": t_cost,
            "net_price":      round(net),
            "distance_km":    distance,
            "signal":         signal['signal'],
            "pressure":       signal['pressure'],
        })

    results.sort(key=lambda x: x['net_price'], reverse=True)

    for r in results:
        if nagpur_modal and nagpur_modal > 0:
            diff            = r['net_price'] - nagpur_modal
            r['vs_nagpur']  = round(diff)
            r['vs_nagpur_pct'] = round((diff / nagpur_modal) * 100, 1)
        else:
            r['vs_nagpur']     = 0
            r['vs_nagpur_pct'] = 0.0

    best = results[0] if results else None
    summary = (
        f"Best market: {best['market']} — ₹{best['net_price']}/quintal net "
        f"({'+' if best['vs_nagpur'] >= 0 else ''}{best['vs_nagpur_pct']}% vs Nagpur)"
        if best else "No market data available"
    )

    return {
        "date":        pred_date.strftime("%Y-%m-%d"),
        "best_market": best,
        "all_markets": results,
        "summary":     summary,
    }




@app.get("/storage-optimizer")
def storage_optimizer(
    market:   str   = Query(default="Nagpur APMC"),
    quantity: float = Query(default=10.0, description="Quintals"),
    days:     int   = Query(default=28, ge=7, le=60)
):
    """
    Sell now vs store analysis.
    Computes net gain/loss per day for next N days.
    Cold storage cost: ₹200/quintal/day.
    """
    today   = datetime.today()
    current = predict_price(market, today)
    if current is None:
        raise HTTPException(404, f"No data for {market}")

    current_price = current['modal_price']
    forecast_data = forecast(market=market, days=days)['forecast']

    daily     = []
    best_gain = 0
    best_day  = 0

    for entry in forecast_data:
        day         = entry['day']
        future_price = entry['modal_price']
        store_cost  = STORAGE_COST_PER_QUINTAL_PER_DAY * day
        price_gain  = future_price - current_price
        net_gain    = price_gain - store_cost

        if net_gain > best_gain:
            best_gain = net_gain
            best_day  = day

        daily.append({
            "day":             day,
            "date":            entry['date'],
            "predicted_price": future_price,
            "storage_cost":    round(store_cost),
            "price_gain":      round(price_gain),
            "net_gain":        round(net_gain),
            "total_revenue":   round((future_price - store_cost) * quantity),
            "profitable":      net_gain > 0,
        })

    sell_now_revenue = round(current_price * quantity)

    if best_day > 0 and best_gain > 0:
        advice = (f"Store {best_day} days. "
                  f"Extra profit: ₹{round(best_gain)}/quintal = "
                  f"₹{round(best_gain * quantity)} on {quantity} quintals.")
    else:
        advice = "Sell now. Storage costs exceed expected price gains over next month."

    return {
        "market":             market,
        "quantity_quintals":  quantity,
        "current_price":      current_price,
        "sell_now_revenue":   sell_now_revenue,
        "optimal_day":        best_day,
        "optimal_net_gain":   round(best_gain),
        "advice":             advice,
        "daily_breakdown":    daily,
    }


@app.get("/historical")
def historical(
    market: str = Query(default="Nagpur APMC"),
    days:   int = Query(default=90, ge=7, le=730)
):
    """
    Historical prices + volume + volatility for chart rendering.
    Also returns seasonal pattern (avg price by month).
    """
    mdf = df[df['market'] == market].sort_values('Date').copy()
    if mdf.empty:
        raise HTTPException(404, f"No data for {market}")

    cutoff = mdf['Date'].max() - timedelta(days=days)
    mdf    = mdf[mdf['Date'] >= cutoff].copy()
    mdf['volatility'] = mdf['modal_price'].rolling(7, min_periods=2).std().fillna(0).round(1)

    records = [
        {
            "date":        row['Date'].strftime("%Y-%m-%d"),
            "min_price":   row['min_price'],
            "modal_price": row['modal_price'],
            "max_price":   row['max_price'],
            "volume":      row['arrival_quantity'],
            "volatility":  row['volatility'],
            "type":        "historical"
        }
        for _, row in mdf.iterrows()
    ]

    # Seasonal pattern across all years
    all_mdf = df[df['market'] == market].copy()
    all_mdf['month'] = all_mdf['Date'].dt.month
    seasonal = (
        all_mdf.groupby('month')['modal_price']
        .mean().round(0)
        .reset_index()
        .rename(columns={'month': 'month', 'modal_price': 'avg_price'})
        .to_dict(orient='records')
    )

    return {
        "market":           market,
        "data_points":      len(records),
        "last_updated":     mdf['Date'].max().strftime("%Y-%m-%d") if not mdf.empty else None,
        "historical":       records,
        "seasonal_pattern": seasonal,
    }



@app.get("/demand-signal")
def get_demand(market: str = Query(default="Nagpur APMC")):
    """Quick demand pressure check for a market"""
    return demand_signal(market)



@app.get("/markets")
def list_markets():
    markets = sorted(df['market'].dropna().unique().tolist())
    return {"markets": markets, "count": len(markets)}




@app.get("/")
def root():
    return {
        "name":      "ORANGE CHAIN — Orange Intelligence API",
        "version":   "2.0",
        "endpoints": [
            "GET /predict?market=Nagpur APMC&date=2026-04-01",
            "GET /forecast?market=Nagpur APMC&days=7",
            "GET /compare-markets?date=2026-04-01",
            "GET /storage-optimizer?market=Nagpur APMC&quantity=20&days=28",
            "GET /historical?market=Nagpur APMC&days=90",
            "GET /demand-signal?market=Nagpur APMC",
            "GET /markets",
        ]
    } 

if __name__=="__main__":
    import uvicorn
    uvicorn.run(
    app,
    host='127.0.0.1',
    port=8000
    )