# Performance (`perf`)

Makes the system faster or leaner without changing public behavior or semantics.

**Use for**:
- Algorithmic improvements
- Caching implementations
- Reduced memory allocations
- Optimized database queries
- I/O batching
- Performance optimizations

**Avoid for**:
- Feature additions
- Bug fixes
- Refactoring

**Examples**:
```text
perf(cache): implement Redis caching for user sessions
perf(db): optimize user query with proper indexing
perf(api): batch database writes to reduce latency
perf(ui): lazy load images for better page performance
```