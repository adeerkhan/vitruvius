# Draft: B-Tree vs LSM-Tree Indexing Research

## Research Question
Compare B-Tree and LSM-Tree indexing structures. What are the read/write amplification factors? Cite academic sources or official database documentation (RocksDB, PostgreSQL docs). What are the tradeoffs?

## Evidence Table

| Claim | Source | Section | Verified |
|-------|--------|---------|----------|
| LSM-tree buffers writes in memory, flushes sequentially | RocksDB LSM Tree Design | LSM Tree Design | Yes |
| B-trees update in place, triggering random writes | RocksDB LSM Tree Design | LSM vs B-Tree | Yes |
| LSM write amplification: 10-30x; B-tree: 2-5x | RocksDB LSM Tree Design | LSM vs B-Tree table | Yes |
| LSM space amplification: 1.3-2x; B-tree: 1.1-1.3x | RocksDB LSM Tree Design | LSM vs B-Tree table | Yes |
| RocksDB leveled compaction write amp approx 33x | RocksDB Tuning Guide | Write amplification | Yes |
| B-tree write amp dominated by page flush amplification | Qiao et al. FAST'22 | Section 2.3 | Yes |
| PostgreSQL B-tree: multi-level tree, 99% leaf pages | PostgreSQL Docs | 65.1.4 Implementation | Yes |
| LSM tree: write-optimized, B-tree: read-optimized | RocksDB LSM Tree Design | LSM vs B-Tree | Yes |
| Three-way tradeoff: write/read/space amplification | RocksDB LSM Tree Design | The Three Ampl | Yes |
| B-tree deduplication reduces index bloat | PostgreSQL Docs | 65.1.4.3 Deduplication | Yes |

## Findings

### B-Tree Characteristics (PostgreSQL Documentation)
- **Structure**: Multi-level tree with metapage at root; leaf pages contain tuples pointing to table rows; internal pages contain downlinks. Over 99% of pages are leaf pages (Section 65.1.4).
- **Update Model**: In-place updates; when a page is modified, it is written back to the same location.
- **Write Amplification**: Typically 2-5x. A single 32-byte record update in an 8KB page results in 8KB/32B = 256x raw amplification before compression.
- **Read Amplification**: Low. Point lookups follow tree path from root to leaf (O(log n)). Binary search within pages.
- **Space Amplification**: 1.1-1.3x due to page splits and fragmentation.
- **Key Features**: Deduplication (posting lists for duplicate keys), bottom-up index deletion, page splits cascade upward.

### LSM-Tree Characteristics (RocksDB Documentation)
- **Structure**: Log-Structured Merge tree with hierarchical levels (L0, L1, L2, ...). Writes buffer in memtable, flush as sorted runs to L0, compact progressively to higher levels.
- **Update Model**: Append-only; writes go to memtable (in-memory), flushed sequentially to disk. Background compaction merges sorted runs.
- **Write Amplification**: 10-30x typical. Leveled compaction: per-level write amp equals fanout (default 10x). Total approx 1+2+10+10+10 = 33x for 5 levels.
- **Read Amplification**: Higher. Must check L0 files (overlapping), then binary search per level. Bloom filters reduce false reads (1% false positive at 10-bit).
- **Space Amplification**: 1.3-2x. Compaction pending data takes extra space. Universal compaction: max_size_amplification_percent default 200%.
- **Compaction Styles**: Leveled (bounded write amp, consistent space), Universal/Tiered (lower write amp, worse space amp), FIFO (time-series retention).

### Amplification Tradeoffs

| Metric | B-Tree | LSM-Tree | Winner |
|--------|--------|----------|--------|
| Write Amplification | 2-5x | 10-30x | B-Tree |
| Read Amplification | O(log n) | Multiple levels + bloom filters | B-Tree |
| Space Amplification | 1.1-1.3x | 1.3-2x | B-Tree |
| Write Throughput | Random I/O (slower) | Sequential I/O (faster) | LSM-Tree |
| Read Latency | Consistent, low | Variable, higher | B-Tree |
| Best Workload | Read-heavy, small datasets | Write-heavy, large datasets | Depends |

### Modern Hardware Considerations (Qiao et al., FAST'22)
Recent research shows that modern storage with built-in transparent compression can close the B-tree vs LSM-tree gap:
- B-tree write amplification reduced by over 10x with sparse data structures
- B-tree can achieve similar or smaller write amplification than RocksDB
- Storage cost gap largely eliminated with hardware compression

## Sources
1. RocksDB LSM Tree Design Documentation (https://facebook-rocksdb-80.mintlify.app/concepts/lsm-design)
2. RocksDB Compaction Wiki (https://github.com/facebook/rocksdb/wiki/Compaction)
3. RocksDB Tuning Guide (https://github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide)
4. PostgreSQL B-Tree Indexes Documentation (https://www.postgresql.org/docs/current/btree.html)
5. Qiao et al., "Closing the B+-tree vs. LSM-tree Write Amplification Gap on Modern Storage Hardware" (USENIX FAST'22)
6. Systems Explained - RocksDB LSM Tree (https://systeminternals.dev/rocksdb/lsm-tree/)
