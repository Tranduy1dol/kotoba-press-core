#!/bin/bash
set -e

# ==============================================================================
# kotoba-press-core Benchmark Orchestration Script
# ==============================================================================

mkdir -p results

# Gather environment info
echo "Gathering environment info..."
CPU_INFO=$(lscpu | grep "Model name" | sed -E 's/Model name:\s+//g' || echo "Unknown CPU")
RAM_INFO=$(free -h | awk '/^Mem:/ {print $2}' || echo "Unknown RAM")
OS_INFO=$(cat /etc/os-release | grep PRETTY_NAME | cut -d '"' -f 2 || echo "Unknown OS")
GO_VERSION=$(go version || echo "Unknown Go version")

# Prepare README
cat <<EOF > results/README.md
# Backend Benchmark Report

## 1. Environment Information
* **CPU:** $CPU_INFO
* **RAM:** $RAM_INFO
* **OS:** $OS_INFO
* **Go Version:** $GO_VERSION
* **Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## 2. Methodology
* **Endpoint Benchmarks:** Isolate each endpoint to determine maximum throughput. (50 VUs, 1 minute, no pacing).
* **Workflow Stress Test:** Tests realistic user behavior (login, reviews, learning, searching) at increasing concurrency levels to identify saturation point and capacity.
* **Server Resource Metrics:** CPU and Memory utilization recorded during tests.

EOF

echo "## 3. Endpoint Benchmarks (Capacity)" >> results/README.md
echo "| Endpoint | VUs | Requests | Req/s | Min | p50 | p95 | p99 | Max | Error % |" >> results/README.md
echo "|----------|-----|----------|-------|-----|-----|-----|-----|-----|---------|" >> results/README.md

ENDPOINTS=(
  "benchmark/endpoints/health.js"
  "benchmark/endpoints/vocabulary.js"
  "benchmark/endpoints/grammar.js"
  "benchmark/endpoints/review.js"
)

# Export trend stats so p(99) is included in summary export
export K6_SUMMARY_TREND_STATS="min,avg,med,max,p(90),p(95),p(99)"

for SCRIPT in "${ENDPOINTS[@]}"; do
  TEST_NAME=$(basename "$SCRIPT" .js)
  echo "Running endpoint test: $TEST_NAME..."
  
  k6 run --summary-export="results/summary_$TEST_NAME.json" "$SCRIPT" > /dev/null 2>&1 || true
  
  if [ -f "results/summary_$TEST_NAME.json" ]; then
    VUS=$(jq '.metrics.vus_max.value // 0' "results/summary_$TEST_NAME.json")
    REQS=$(jq '.metrics.http_reqs.count // 0' "results/summary_$TEST_NAME.json")
    REQS_S=$(jq '.metrics.http_reqs.rate // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    
    MIN=$(jq '.metrics.http_req_duration.min // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    MED=$(jq '.metrics.http_req_duration.med // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    P95=$(jq '.metrics.http_req_duration["p(95)"] // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    P99=$(jq '.metrics.http_req_duration["p(99)"] // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    MAX=$(jq '.metrics.http_req_duration.max // 0' "results/summary_$TEST_NAME.json" | awk '{printf "%.2f", $1}')
    
    # Calculate error percentage using http_req_failed passes
    FAIL_COUNT=$(jq '.metrics.http_req_failed.passes // 0' "results/summary_$TEST_NAME.json")
    TOTAL_REQS=$(jq '.metrics.http_reqs.count // 0' "results/summary_$TEST_NAME.json")
    ERR_PCT=$(awk -v fails="$FAIL_COUNT" -v total="$TOTAL_REQS" 'BEGIN { if(total>0) printf "%.2f%%", (fails/total)*100; else print "0.00%" }')

    echo "| **$TEST_NAME** | $VUS | $REQS | $REQS_S | ${MIN}ms | ${MED}ms | ${P95}ms | ${P99}ms | ${MAX}ms | $ERR_PCT |" >> results/README.md
  fi
done

echo "" >> results/README.md
echo "## 4. Workflow Stress Test (Realistic Load)" >> results/README.md
echo "| VUs | Requests | Req/s | p50 | p95 | p99 | Max | Error % | Avg API CPU | Avg API Mem | Avg Mongo CPU | Avg Mongo Mem |" >> results/README.md
echo "|-----|----------|-------|-----|-----|-----|-----|---------|-------------|-------------|---------------|---------------|" >> results/README.md

API_PID=$(lsof -ti :8080 | head -n1 || echo "")
MONGO_CONTAINER=$(docker ps --format '{{.Names}}' | grep 'mongo' | head -n1 || echo "")

STRESS_VUS=(10 50 100 200 400 800)
for vus in "${STRESS_VUS[@]}"; do
  echo "Running stress test with $vus VUs..."
  
  rm -f results/api_stats.txt results/mongo_stats.csv
  touch results/api_stats.txt results/mongo_stats.csv
  
  # Gather stats in background
  while true; do 
    if [ -n "$API_PID" ]; then
      ps -p $API_PID -o %cpu=,rss= >> results/api_stats.txt || true
    fi
    if [ -n "$MONGO_CONTAINER" ]; then
      docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}" $MONGO_CONTAINER >> results/mongo_stats.csv 2>/dev/null || true
    fi
    sleep 2
  done &
  STATS_PID=$!

  k6 run -u $vus -d 30s --summary-export="results/summary_stress_${vus}.json" "benchmark/workflows/constant.js" > /dev/null 2>&1 || true
  
  kill $STATS_PID 2>/dev/null || true
  wait $STATS_PID 2>/dev/null || true
  
  if [ -f "results/summary_stress_${vus}.json" ]; then
    REQS=$(jq '.metrics.http_reqs.count // 0' "results/summary_stress_${vus}.json")
    REQS_S=$(jq '.metrics.http_reqs.rate // 0' "results/summary_stress_${vus}.json" | awk '{printf "%.2f", $1}')
    
    MED=$(jq '.metrics.http_req_duration.med // 0' "results/summary_stress_${vus}.json" | awk '{printf "%.2f", $1}')
    P95=$(jq '.metrics.http_req_duration["p(95)"] // 0' "results/summary_stress_${vus}.json" | awk '{printf "%.2f", $1}')
    P99=$(jq '.metrics.http_req_duration["p(99)"] // 0' "results/summary_stress_${vus}.json" | awk '{printf "%.2f", $1}')
    MAX=$(jq '.metrics.http_req_duration.max // 0' "results/summary_stress_${vus}.json" | awk '{printf "%.2f", $1}')
    
    FAIL_COUNT=$(jq '.metrics.http_req_failed.passes // 0' "results/summary_stress_${vus}.json")
    TOTAL_REQS=$(jq '.metrics.http_reqs.count // 0' "results/summary_stress_${vus}.json")
    ERR_PCT=$(awk -v fails="$FAIL_COUNT" -v total="$TOTAL_REQS" 'BEGIN { if(total>0) printf "%.2f%%", (fails/total)*100; else print "0.00%" }')

    API_CPU="N/A"
    API_MEM="N/A"
    if [ -s results/api_stats.txt ]; then
      API_CPU=$(awk '{sum+=$1; count++} END {if (count>0) printf "%.2f%%", sum/count; else print "N/A"}' results/api_stats.txt)
      API_MEM=$(awk '{sum+=$2; count++} END {if (count>0) printf "%.1fMB", (sum/count)/1024; else print "N/A"}' results/api_stats.txt)
    fi

    MONGO_CPU="N/A"
    MONGO_MEM="N/A"
    if [ -s results/mongo_stats.csv ]; then
      MONGO_CPU=$(awk -F',' '{print $2}' results/mongo_stats.csv | sed 's/%//' | awk '{sum+=$1} END {if (NR>0) printf "%.2f%%", sum/NR; else print "N/A"}')
      MONGO_MEM=$(awk -F',' '{print $3}' results/mongo_stats.csv | awk '{print $1}' | sed 's/[^0-9.]//g' | awk '{sum+=0+$1; count++} END {if(count>0) printf "%.1fMB", sum/count; else print "N/A"}')
    fi

    echo "| $vus | $REQS | $REQS_S | ${MED}ms | ${P95}ms | ${P99}ms | ${MAX}ms | $ERR_PCT | $API_CPU | $API_MEM | $MONGO_CPU | $MONGO_MEM |" >> results/README.md
  fi
done

echo "" >> results/README.md
echo "## 5. Conclusions" >> results/README.md
echo "Based on the stress tests, look for the point at which \`Req/s\` flattens or \`p99 latency\` spikes dramatically. That point is the system's current saturation point." >> results/README.md
echo "Additionally, any errors appearing during high concurrency typically indicate database connection exhaustion or CPU saturation (check the resource columns)." >> results/README.md

echo "Benchmark run complete! Check results/README.md for the report."
