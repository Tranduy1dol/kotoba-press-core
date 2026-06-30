#!/bin/bash
set -e

# ==============================================================================
# kotoba-press-core Benchmark Orchestration Script
# ==============================================================================

mkdir -p results

# Environment Information
echo "Gathering environment info..."
CPU_INFO=$(lscpu | grep "Model name" | sed -E 's/Model name:\s+//g' || echo "Unknown CPU")
RAM_INFO=$(free -h | awk '/^Mem:/ {print $2}' || echo "Unknown RAM")
OS_INFO=$(cat /etc/os-release | grep PRETTY_NAME | cut -d '"' -f 2 || echo "Unknown OS")
GO_VERSION=$(go version || echo "Unknown Go version")

# Prepare README
cat <<EOF > results/README.md
# Benchmark Report

## Environment Information
* **CPU:** $CPU_INFO
* **RAM:** $RAM_INFO
* **OS:** $OS_INFO
* **Go Version:** $GO_VERSION
* **Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Benchmark Results

| Test Suite | Max VUs | Requests | Req/s | Avg Latency | p90 | p95 | p99 | Errors |
|------------|---------|----------|-------|-------------|-----|-----|-----|--------|
EOF

# Array of scripts to run
# Depending on time constraints, soak test might be excluded from standard runs
SCRIPTS=(
  "benchmark/endpoints/health.js"
  "benchmark/endpoints/vocabulary.js"
  "benchmark/endpoints/grammar.js"
  "benchmark/endpoints/review.js"
  "benchmark/workflows/load.js"
  "benchmark/workflows/stress.js"
  "benchmark/workflows/spike.js"
)

echo "Running benchmarks..."
for SCRIPT in "${SCRIPTS[@]}"; do
  TEST_NAME=$(basename "$SCRIPT" .js)
  echo "Running $TEST_NAME..."
  
  # Run k6 and export summary to JSON
  k6 run --summary-export="results/summary_$TEST_NAME.json" "$SCRIPT" > /dev/null 2>&1 || echo "k6 run $TEST_NAME finished with non-zero exit code (expected in stress/spike)"
  
  if [ -f "results/summary_$TEST_NAME.json" ]; then
    # Parse metrics with jq
    VUS=$(jq '.metrics.vus_max.value // 0' "results/summary_$TEST_NAME.json")
    REQS=$(jq '.metrics.http_reqs.count // 0' "results/summary_$TEST_NAME.json")
    REQS_S=$(jq '.metrics.http_reqs.rate // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    AVG=$(jq '.metrics.http_req_duration.avg // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    P90=$(jq '.metrics.http_req_duration["p(90)"] // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    P95=$(jq '.metrics.http_req_duration["p(95)"] // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    P99=$(jq '.metrics.http_req_duration["p(99)"] // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    ERRS=$(jq '.metrics.http_req_failed.count // 0' "results/summary_$TEST_NAME.json")

    echo "| **$TEST_NAME** | $VUS | $REQS | $REQS_S | ${AVG}ms | ${P90}ms | ${P95}ms | ${P99}ms | $ERRS |" >> results/README.md
  else
    echo "| **$TEST_NAME** | - | - | - | - | - | - | - | FAILED TO RUN |" >> results/README.md
  fi
done

echo "" >> results/README.md
echo "## Notes" >> results/README.md
echo "- **Stress and Spike tests** are designed to push the system to its limits, so higher latency and errors are expected." >> results/README.md
echo "- **Endpoints tests** evaluate individual APIs in isolation." >> results/README.md

echo "Benchmark run complete! Check results/README.md for the report."
