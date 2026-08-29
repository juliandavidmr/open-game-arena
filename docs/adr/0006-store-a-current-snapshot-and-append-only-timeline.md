# Store a current snapshot and append-only timeline

Each Match will persist its current status, Position, Turn, deadlines, expiry, and monotonically increasing revision in a primary row, while accepted Moves and Arena-visible events are appended to separate history tables. This avoids the read cost and reconstruction complexity of full event sourcing without collapsing permanent history into a mutable JSON document; every accepted state change updates the snapshot and appends its history inside one Postgres transaction.
