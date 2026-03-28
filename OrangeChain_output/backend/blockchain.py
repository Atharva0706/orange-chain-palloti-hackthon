"""
OrangeChain Python Blockchain Service
Flask-based blockchain that records orange marketplace transactions.
Runs on port 5001. Called by Node.js backend after delivery confirmation.
"""

import hashlib
import json
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
from uuid import uuid4

app = Flask(__name__)
CORS(app)

# ─── Block Class ───────────────────────────────────────────────────────────────
class Block:
    def __init__(self, index, transactions, previous_hash, nonce=0):
        self.index = index
        self.timestamp = time.time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce

    def to_dict(self):
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "hash": self.hash()
        }

    def hash(self):
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()


# ─── Blockchain Class ──────────────────────────────────────────────────────────
class Blockchain:
    DIFFICULTY = 3  # Number of leading zeros required in hash

    def __init__(self):
        self.chain = []
        self.pending_transactions = []
        self._create_genesis_block()

    def _create_genesis_block(self):
        genesis = Block(0, [], "0")
        genesis.nonce = self._proof_of_work(genesis)
        self.chain.append(genesis)

    def _proof_of_work(self, block):
        nonce = 0
        prefix = '0' * self.DIFFICULTY
        while True:
            block.nonce = nonce
            if block.hash().startswith(prefix):
                return nonce
            nonce += 1

    def get_last_block(self):
        return self.chain[-1]

    def add_pending_transaction(self, transaction):
        self.pending_transactions.append(transaction)
        return len(self.pending_transactions)

    def mine_block(self):
        if not self.pending_transactions:
            return None

        last_block = self.get_last_block()
        new_block = Block(
            index=len(self.chain),
            transactions=self.pending_transactions.copy(),
            previous_hash=last_block.hash()
        )
        new_block.nonce = self._proof_of_work(new_block)
        self.chain.append(new_block)
        self.pending_transactions = []
        return new_block

    def is_chain_valid(self):
        prefix = '0' * self.DIFFICULTY
        for i in range(1, len(self.chain)):
            current  = self.chain[i]
            previous = self.chain[i - 1]
            current_hash  = current.hash()
            previous_hash = previous.hash()
            # 1. Proof-of-Work: hash must start with required leading zeros
            if not current_hash.startswith(prefix):
                return False
            # 2. Linkage: stored previous_hash must match the actual hash of the prior block
            if current.previous_hash != previous_hash:
                return False
        return True

    def to_dict(self):
        return [block.to_dict() for block in self.chain]


# ─── Blockchain Instance ───────────────────────────────────────────────────────
blockchain = Blockchain()
node_id = str(uuid4()).replace('-', '')


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OrangeChain blockchain node is running", "node_id": node_id}), 200


@app.route('/add_transaction', methods=['POST'])
def add_transaction():
    """
    Add a pending transaction to the pool.
    Expected body:
    {
      "transactionId": "...",  # MongoDB transaction _id
      "produceId": "...",
      "farmerId": "...",
      "buyerId": "...",
      "amount": 12500,
      "escrowStatus": "Delivered",
      "timestamp": "..."
    }
    """
    data = request.get_json()
    required_fields = ['transactionId', 'farmerId', 'buyerId', 'amount']

    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    transaction = {
        "transactionId": data.get("transactionId"),
        "produceId": data.get("produceId", ""),
        "farmerId": data.get("farmerId"),
        "buyerId": data.get("buyerId"),
        "amount": data.get("amount"),
        "escrowStatus": data.get("escrowStatus", "Delivered"),
        "timestamp": data.get("timestamp", time.time())
    }

    index = blockchain.add_pending_transaction(transaction)
    return jsonify({
        "message": f"Transaction added to pool. Will be included in block #{index}.",
        "pending_count": len(blockchain.pending_transactions)
    }), 201


@app.route('/mine_block', methods=['POST'])
def mine_block():
    """
    Mine a new block with all pending transactions.
    Returns the newly mined block with its hash.
    """
    if not blockchain.pending_transactions:
        return jsonify({"error": "No pending transactions to mine"}), 400

    mined_block = blockchain.mine_block()

    if not mined_block:
        return jsonify({"error": "Mining failed"}), 500

    return jsonify({
        "message": "Block successfully mined!",
        "block": mined_block.to_dict()
    }), 200


@app.route('/get_chain', methods=['GET'])
def get_chain():
    """
    Return the full blockchain with all mined blocks.
    """
    chain_data = blockchain.to_dict()
    return jsonify({
        "chain": chain_data,
        "length": len(chain_data),
        "is_valid": blockchain.is_chain_valid()
    }), 200


@app.route('/get_block/<int:index>', methods=['GET'])
def get_block(index):
    """Get a specific block by index."""
    if index >= len(blockchain.chain):
        return jsonify({"error": "Block not found"}), 404
    return jsonify(blockchain.chain[index].to_dict()), 200


@app.route('/pending_transactions', methods=['GET'])
def pending_transactions():
    return jsonify({
        "pending_transactions": blockchain.pending_transactions,
        "count": len(blockchain.pending_transactions)
    }), 200


if __name__ == '__main__':
    print("=" * 50)
    print("  OrangeChain Blockchain Node")
    print("  Running on http://localhost:5001")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True)
