"""
RetailGuard Backend — AI-Powered Loss Prevention System
Flask REST API with AI analytics engine
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)

# ============================================================
# MOCK DATA STORE (replaces Firebase for hackathon demo)
# ============================================================

inventory = [
    {"id": "INV001", "name": "Toor Dal (1kg)", "category": "Grocery", "stock": 5, "price": 140, "dailySales": 3},
    {"id": "INV002", "name": "Basmati Rice (5kg)", "category": "Grocery", "stock": 25, "price": 450, "dailySales": 4},
    {"id": "INV003", "name": "Amul Butter (500g)", "category": "Dairy", "stock": 2, "price": 270, "dailySales": 2},
    {"id": "INV004", "name": "Surf Excel (1kg)", "category": "Household", "stock": 30, "price": 220, "dailySales": 2},
    {"id": "INV005", "name": "Maggi Noodles (Pack of 12)", "category": "Snacks", "stock": 0, "price": 168, "dailySales": 5},
    {"id": "INV006", "name": "Aashirvaad Atta (10kg)", "category": "Grocery", "stock": 15, "price": 480, "dailySales": 3},
    {"id": "INV007", "name": "Parle-G Biscuits (800g)", "category": "Snacks", "stock": 40, "price": 80, "dailySales": 6},
    {"id": "INV008", "name": "Vim Dishwash Bar", "category": "Household", "stock": 3, "price": 32, "dailySales": 2},
    {"id": "INV009", "name": "Mother Dairy Milk (1L)", "category": "Dairy", "stock": 8, "price": 64, "dailySales": 10},
    {"id": "INV010", "name": "Colgate Toothpaste", "category": "Personal Care", "stock": 18, "price": 120, "dailySales": 1},
    {"id": "INV011", "name": "Lay's Chips (Large)", "category": "Snacks", "stock": 22, "price": 50, "dailySales": 4},
    {"id": "INV012", "name": "Fortune Oil (1L)", "category": "Grocery", "stock": 6, "price": 180, "dailySales": 2},
    {"id": "INV013", "name": "Sugar (1kg)", "category": "Grocery", "stock": 35, "price": 45, "dailySales": 3},
    {"id": "INV014", "name": "Dettol Soap (3 Pack)", "category": "Personal Care", "stock": 12, "price": 165, "dailySales": 1},
    {"id": "INV015", "name": "Britannia Bread", "category": "Bakery", "stock": 4, "price": 45, "dailySales": 8},
]

today = datetime.now().strftime("%Y-%m-%d")
yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

transactions = [
    {"id": "TXN001", "date": today, "items": ["Basmati Rice", "Toor Dal"], "amount": 590, "paymentType": "upi", "status": "completed"},
    {"id": "TXN002", "date": today, "items": ["Maggi Noodles", "Lay's Chips"], "amount": 218, "paymentType": "cash", "status": "completed"},
    {"id": "TXN003", "date": today, "items": ["Amul Butter", "Milk"], "amount": 334, "paymentType": "upi", "status": "flagged", "flag_reason": "Amount mismatch: expected ₹334, received ₹300"},
    {"id": "TXN004", "date": yesterday, "items": ["Surf Excel", "Vim Bar"], "amount": 252, "paymentType": "upi", "status": "completed"},
    {"id": "TXN005", "date": yesterday, "items": ["Atta 10kg", "Sugar", "Oil"], "amount": 705, "paymentType": "cash", "status": "completed"},
]

payments = [
    {"id": "PAY001", "transactionId": "TXN001", "date": today, "method": "upi", "expected": 590, "received": 590, "status": "verified"},
    {"id": "PAY002", "transactionId": "TXN002", "date": today, "method": "cash", "expected": 218, "received": 218, "status": "verified"},
    {"id": "PAY003", "transactionId": "TXN003", "date": today, "method": "upi", "expected": 334, "received": 300, "status": "mismatch"},
    {"id": "PAY004", "transactionId": "TXN004", "date": yesterday, "method": "upi", "expected": 252, "received": 252, "status": "verified"},
    {"id": "PAY005", "transactionId": "TXN005", "date": yesterday, "method": "cash", "expected": 705, "received": 700, "status": "mismatch"},
]


def get_item_status(stock):
    try:
        stock = float(stock)
    except (ValueError, TypeError):
        stock = 0
        
    if stock == 0:
        return "out_of_stock"
    elif stock <= 5:
        return "low_stock"
    return "in_stock"


# ============================================================
# AI ENGINE — Stock, Payment, and Anomaly Analysis
# ============================================================

def analyze_stock_shortages():
    """Detect items that will run out soon based on daily sales rate."""
    alerts = []
    for item in inventory:
        if item["dailySales"] > 0 and item["stock"] > 0:
            days_left = item["stock"] / item["dailySales"]
            if days_left <= 3:
                alerts.append({
                    "type": "restock",
                    "severity": "high" if days_left <= 1 else "medium",
                    "item": item["name"],
                    "stock": item["stock"],
                    "daysLeft": round(days_left, 1),
                    "dailySales": item["dailySales"],
                    "recommendation": f"Order at least {item['dailySales'] * 10} units to cover 10 days.",
                    "confidence": min(95, 70 + int(days_left * 8))
                })
        elif item["stock"] == 0:
            alerts.append({
                "type": "restock",
                "severity": "high",
                "item": item["name"],
                "stock": 0,
                "daysLeft": 0,
                "dailySales": item["dailySales"],
                "recommendation": f"Out of stock! Restock {item['name']} urgently.",
                "confidence": 99
            })
    return sorted(alerts, key=lambda x: x["daysLeft"])


def detect_expirations():
    """Detect items expiring soon and recommend clearance discounts."""
    expirations = []
    for item in inventory:
        expiry_raw = item.get("expiryDays", 999)
        try:
            expiry_days = int(expiry_raw)
        except (ValueError, TypeError):
            expiry_days = 999
            
        if expiry_days <= 14 and float(item.get("stock", 0)) > 0:
            expirations.append({
                "type": "sales_drop",
                "severity": "high",
                "itemId": item["id"],
                "item": item["name"],
                "expiryDays": expiry_days,
                "recommendation": "insights.expiring_soon_rec",
                "recommendationParams": {"stock": item["stock"], "unit": item.get('unit', 'units')},
                "confidence": 90
            })
    return expirations

def analyze_payment_mismatches():
    """Compare expected vs received payments and flag discrepancies."""
    mismatches = []
    for payment in payments:
        diff = payment["expected"] - payment["received"]
        if diff > 0:
            mismatches.append({
                "type": "payment_mismatch",
                "severity": "high" if diff > 50 else "medium" if diff > 10 else "low",
                "paymentId": payment["id"],
                "transactionId": payment["transactionId"],
                "expected": payment["expected"],
                "received": payment["received"],
                "difference": diff,
                "method": payment["method"],
                "recommendation": f"Verify {payment['method'].upper()} payment for {payment['transactionId']}. Missing ₹{diff}.",
                "confidence": 90 if payment["method"] == "upi" else 75
            })
    return mismatches


def detect_anomalies():
    """Detect unusual transactions using z-score-like analysis."""
    if len(transactions) < 3:
        return []
    
    amounts = [t["amount"] for t in transactions]
    avg_amount = sum(amounts) / len(amounts)
    
    # Simple standard deviation
    variance = sum((x - avg_amount) ** 2 for x in amounts) / len(amounts)
    std_dev = variance ** 0.5
    
    anomalies = []
    for txn in transactions:
        if std_dev > 0:
            z_score = (txn["amount"] - avg_amount) / std_dev
            if abs(z_score) > 1.5:
                deviation = round(txn["amount"] / avg_amount, 1)
                anomalies.append({
                    "type": "anomaly",
                    "severity": "high" if abs(z_score) > 2.5 else "medium",
                    "transactionId": txn["id"],
                    "amount": txn["amount"],
                    "avgAmount": round(avg_amount),
                    "deviation": deviation,
                    "zScore": round(z_score, 2),
                    "recommendation": f"Verify {txn['id']}: ₹{txn['amount']} is {deviation}x the average (₹{round(avg_amount)}).",
                    "confidence": min(95, 60 + int(abs(z_score) * 15))
                })
    return anomalies


def analyze_festivals():
    """Predict seasonal/festival demand and recommend stocking up."""
    current_date = datetime.now()
    year = current_date.year
    
    festivals = [
        {"name": "Diwali", "date": datetime(year, 11, 1), "items": "Crackers, Sweets, Diyas, Ghee"},
        {"name": "Holi", "date": datetime(year, 3, 14), "items": "Colors, Water Guns, Sweets"},
        {"name": "Baisakhi / Vishu", "date": datetime(year, 4, 14), "items": "Sweets, Rice, Fruits, Flowers, Jaggery"},
        {"name": "Eid", "date": datetime(year, 3, 31), "items": "Dates, Sewaiyan, Dry Fruits, Milk"},
        {"name": "Raksha Bandhan", "date": datetime(year, 8, 19), "items": "Rakhis, Sweets, Gifts"},
        {"name": "Ganesh Chaturthi", "date": datetime(year, 9, 7), "items": "Modaks, Pooja Samagri, Flowers"},
        {"name": "Navratri / Dussehra", "date": datetime(year, 10, 12), "items": "Fasting Foods, Fruits, Pooja Items"},
        {"name": "Christmas", "date": datetime(year, 12, 25), "items": "Cakes, Chocolates, Decorations"}
    ]
    
    # Push passed festivals to next year
    for fest in festivals:
        if current_date > fest["date"] and (current_date - fest["date"]).days > 2:
            fest["date"] = datetime(year + 1, fest["date"].month, fest["date"].day)
            
    recommendations = []
    
    for fest in festivals:
        days_diff = (fest["date"] - current_date).days
        # Show alert if the festival is within 30 days
        if 0 <= days_diff <= 30:
            recommendations.append({
                "type": "festival_promo",
                "severity": "medium" if days_diff > 7 else "high",
                "festival": fest["name"],
                "daysLeft": days_diff,
                "items": fest["items"],
                "recommendation": f"Prepare for {fest['name']} in {days_diff} days! Stock up on {fest['items']} to maximize sales.",
                "confidence": 95 if days_diff <= 15 else 85
            })
            
    return recommendations

# ============================================================
# API ROUTES
# ============================================================

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    today_txns = [t for t in transactions if t["date"] == today]
    today_sales = sum(t["amount"] for t in today_txns)
    stock_warnings = sum(1 for i in inventory if get_item_status(i["stock"]) in ["low_stock", "out_of_stock"])
    payment_mismatches = sum(1 for p in payments if p["status"] == "mismatch")
    
    return jsonify({
        "todaySales": today_sales,
        "activeAlerts": len(analyze_stock_shortages()) + len(analyze_payment_mismatches()),
        "stockWarnings": stock_warnings,
        "paymentMismatches": payment_mismatches,
        "salesChange": 12.5,
        "alertChange": -2,
        "stockChange": 3,
        "paymentChange": 1
    })


@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    result = []
    for item in inventory:
        result.append({**item, "status": get_item_status(item["stock"])})
    return jsonify(result)


@app.route("/api/inventory", methods=["POST"])
def add_inventory_item():
    data = request.json
    new_id = f"INV{str(len(inventory) + 1).zfill(3)}"
    new_item = {
        "id": new_id,
        "name": data.get("name", ""),
        "category": data.get("category", "Grocery"),
        "stock": float(data.get("stock", 0)),
        "price": float(data.get("price", 0)),
        "dailySales": int(data.get("dailySales", 1))
    }
    inventory.append(new_item)
    return jsonify({**new_item, "status": get_item_status(new_item["stock"])}), 201


@app.route("/api/inventory/<item_id>", methods=["PUT"])
def update_inventory(item_id):
    data = request.json
    for item in inventory:
        if item["id"] == item_id:
            if "stock" in data:
                try: data["stock"] = float(data["stock"])
                except (ValueError, TypeError): pass
            if "price" in data:
                try: data["price"] = float(data["price"])
                except (ValueError, TypeError): pass
            if "dailySales" in data:
                try: data["dailySales"] = int(data["dailySales"])
                except (ValueError, TypeError): pass
            if "expiryDays" in data:
                try: data["expiryDays"] = int(data["expiryDays"])
                except (ValueError, TypeError): pass
                
            item.update(data)
            return jsonify({**item, "status": get_item_status(item["stock"])})
    return jsonify({"error": "Item not found"}), 404

@app.route("/api/inventory/<item_id>", methods=["DELETE"])
def delete_inventory_item(item_id):
    global inventory
    initial_len = len(inventory)
    inventory = [item for item in inventory if item["id"] != item_id]
    if len(inventory) < initial_len:
        return jsonify({"message": "Item deleted"}), 200
    return jsonify({"error": "Item not found"}), 404


@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    return jsonify(transactions)


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.json
    new_id = f"TXN{str(len(transactions) + 1).zfill(3)}"
    new_txn = {
        "id": new_id,
        "date": data.get("date", today),
        "items": data.get("items", []),
        "amount": data.get("amount", 0),
        "paymentType": data.get("paymentType", "cash"),
        "status": "completed"
    }
    transactions.append(new_txn)
    return jsonify(new_txn), 201


@app.route("/api/payments", methods=["GET"])
def get_payments():
    return jsonify(payments)


@app.route("/api/payments/verify", methods=["POST"])
def verify_payment():
    """Simulate UPI payment verification."""
    data = request.json
    payment_id = data.get("paymentId")
    
    for payment in payments:
        if payment["id"] == payment_id:
            # Simulate verification
            if payment["expected"] == payment["received"]:
                payment["status"] = "verified"
            else:
                payment["status"] = "mismatch"
            return jsonify(payment)
    
    return jsonify({"error": "Payment not found"}), 404


@app.route("/api/insights", methods=["GET"])
def get_insights():
    """AI-generated insights combining all analyses."""
    stock_alerts = analyze_stock_shortages()
    payment_issues = analyze_payment_mismatches()
    anomalies = detect_anomalies()
    festivals = analyze_festivals()
    
    all_insights = []
    
    # Format stock alerts as insights
    for alert in stock_alerts:
        all_insights.append({
            "id": f"INS-STOCK-{alert['item'][:3].upper()}",
            "type": "restock",
            "severity": alert["severity"],
            "title": "Stock Shortage Prediction",
            "message": f"{alert['item']} will run out in {alert['daysLeft']} days. Current stock: {alert['stock']} units.",
            "recommendation": alert["recommendation"],
            "confidence": alert["confidence"],
            "icon": "📦",
            "trend": "up"
        })
        
    # Format expirations
    for exp in detect_expirations():
        all_insights.append({
            "id": f"INS-EXP-{exp['itemId']}",
            "type": "sales_drop",
            "severity": exp["severity"],
            "title": "insights.expiring_soon",
            "message": "insights.expiring_soon_msg",
            "messageParams": {"item": exp["item"], "days": exp["expiryDays"]},
            "recommendation": exp["recommendation"],
            "recommendationParams": exp["recommendationParams"],
            "confidence": exp["confidence"],
            "icon": "⏳",
            "trend": "down"
        })
    
    # Format payment mismatches
    for issue in payment_issues:
        all_insights.append({
            "id": f"INS-PAY-{issue['paymentId']}",
            "type": "payment",
            "severity": issue["severity"],
            "title": "Payment Mismatch Detected",
            "message": f"₹{issue['difference']} missing in {issue['transactionId']} ({issue['method'].upper()}).",
            "recommendation": issue["recommendation"],
            "confidence": issue["confidence"],
            "icon": "💸",
            "trend": "down"
        })
    
    # Format anomalies
    for anomaly in anomalies:
        all_insights.append({
            "id": f"INS-ANOM-{anomaly['transactionId']}",
            "type": "anomaly",
            "severity": anomaly["severity"],
            "title": "Unusual Transaction Detected",
            "message": f"Transaction {anomaly['transactionId']} of ₹{anomaly['amount']} is {anomaly['deviation']}x the average.",
            "recommendation": anomaly["recommendation"],
            "confidence": anomaly["confidence"],
            "icon": "🔍",
            "trend": "up"
        })
        
    # Format festivals
    for fest in festivals:
        all_insights.append({
            "id": f"INS-FEST-{fest['festival'].split()[0].upper()}",
            "type": "restock",
            "severity": fest["severity"],
            "title": f"Upcoming Festival: {fest['festival']}",
            "message": f"{fest['festival']} is arriving in {fest['daysLeft']} days.",
            "recommendation": fest["recommendation"],
            "confidence": fest["confidence"],
            "icon": "🎉",
            "trend": "up"
        })
    
    # Sort by severity (high first)
    severity_order = {"high": 0, "medium": 1, "low": 2}
    all_insights.sort(key=lambda x: severity_order.get(x["severity"], 3))
    
    return jsonify(all_insights)


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Get active alerts from all detection systems."""
    alerts = []
    
    for alert in analyze_stock_shortages():
        alerts.append({
            "id": f"ALT-{alert['item'][:3].upper()}",
            "type": "stock",
            "severity": alert["severity"],
            "title": f"{alert['item']} — {'Out of Stock' if alert['stock'] == 0 else 'Low Stock'}",
            "message": "Stock depleted. Will run out in 0 days." if alert['stock'] == 0 else f"Only {alert['stock']} units left. Will run out in {alert['daysLeft']} days.",
            "time": f"{random.randint(5, 120)} min ago",
            "icon": "📦"
        })
    
    for issue in analyze_payment_mismatches():
        alerts.append({
            "id": f"ALT-{issue['paymentId']}",
            "type": "payment",
            "severity": issue["severity"],
            "title": f"Payment Mismatch — {issue['transactionId']}",
            "message": f"Expected ₹{issue['expected']}, received ₹{issue['received']}. Gap: ₹{issue['difference']}.",
            "time": f"{random.randint(10, 180)} min ago",
            "icon": "💰"
        })
    
    return jsonify(alerts)


@app.route("/api/sales-data", methods=["GET"])
def get_sales_data():
    """Weekly sales data for chart."""
    return jsonify([
        {"day": "Mon", "sales": 4250, "transactions": 12},
        {"day": "Tue", "sales": 3800, "transactions": 10},
        {"day": "Wed", "sales": 5100, "transactions": 15},
        {"day": "Thu", "sales": 2900, "transactions": 8},
        {"day": "Fri", "sales": 4600, "transactions": 13},
        {"day": "Sat", "sales": 6200, "transactions": 18},
        {"day": "Sun", "sales": 3400, "transactions": 9},
    ])


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "RetailGuard API",
        "version": "1.0.0",
        "ai_engine": "active",
        "timestamp": datetime.now().isoformat()
    })


if __name__ == "__main__":
    print("\n🛡️  RetailGuard Backend API")
    print("=" * 40)
    print("🚀 Server starting on http://localhost:5000")
    print("📊 AI Engine: Active")
    print(f"📦 Inventory items: {len(inventory)}")
    print(f"💳 Transactions: {len(transactions)}")
    print(f"💰 Payments: {len(payments)}")
    print("=" * 40 + "\n")
    app.run(debug=True, port=5000)
