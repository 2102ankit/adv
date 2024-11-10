// Global variables for data and chart states
let globalData;
let showRegression = false;

// async function loadData() {
//   try {
//     const response = await fetch("./AutoInsurance.csv");
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const csvText = await response.text();
//     const rawData = d3.csvParse(csvText);

//     if (!rawData || !rawData.length) {
//       throw new Error("No data found in CSV file");
//     }

//     // Convert string values to numbers with proper parsing
//     const data = rawData.map((d) => ({
//       ...d,
//       CustomerLifetimeValue: parseFloat(
//         d.CustomerLifetimeValue.replace(/[^0-9.-]+/g, "")
//       ),
//       Income: parseFloat(d.Income.replace(/[^0-9.-]+/g, "")),
//       MonthlyPremiumAuto: parseFloat(
//         d.MonthlyPremiumAuto.replace(/[^0-9.-]+/g, "")
//       ),
//       TotalClaimAmount: parseFloat(
//         d.TotalClaimAmount.replace(/[^0-9.-]+/g, "")
//       ),
//       MonthsSinceLastClaim: parseInt(d.MonthsSinceLastClaim) || 0,
//       MonthsSincePolicyInception: parseInt(d.MonthsSincePolicyInception) || 0,
//       EffectiveToDate: new Date(d.EffectiveToDate),
//       // Preserve other string fields
//       VehicleClass: d.VehicleClass,
//       Coverage: d.Coverage,
//       EmploymentStatus: d.EmploymentStatus,
//       MaritalStatus: d.MaritalStatus,
//       Gender: d.Gender,
//       Education: d.Education,
//       Location: d.Location,
//     }));

//     // Validate the conversion worked
//     console.log("Sample data point:", data[0]);

//     globalData = data;
//     const loadingElement = document.querySelector(".loading");
//     if (loadingElement) {
//       loadingElement.style.display = "none";
//     }
//     createDashboard();
//   } catch (error) {
//     console.error("Error loading data:", error);
//     const loadingElement = document.querySelector(".loading");
//     if (loadingElement) {
//       loadingElement.innerHTML =
//         "Error loading data. Please check if the CSV file exists and is accessible.";
//     }
//     globalData = [];
//   }
// }

// function createDashboard() {
//   try {
//     // Validate data before creating dashboard
//     if (!checkDataValidity()) {
//       throw new Error(
//         "Data validation failed - numeric fields are not properly converted"
//       );
//     }

//     updateSummaryStats();
//     if (globalData && globalData.length > 0) {
//       createHistogram();
//       createVehicleClassPlot();
//       createScatterPlot();
//       createTimeSeriesPlot();
//     }
//   } catch (error) {
//     console.error("Error creating dashboard:", error);
//     document.getElementById("summary-stats").innerHTML = `
//         <div style="color: red; text-align: center; margin-top: 20px;">
//           Error creating dashboard: ${error.message}
//         </div>
//       `;
//   }
// }

// function updateSummaryStats() {
//   if (!globalData || !globalData.length) {
//     document.getElementById("summary-stats").innerHTML = `
//         <div style="display: flex; justify-content: center; gap: 40px; margin-top: 20px;">
//           <div>No data available</div>
//         </div>
//       `;
//     return;
//   }

//   // Add debugging logs
//   console.log("Sample values:");
//   console.log("CustomerLifetimeValue:", globalData[0].CustomerLifetimeValue);
//   console.log("MonthlyPremiumAuto:", globalData[0].MonthlyPremiumAuto);
//   console.log("TotalClaimAmount:", globalData[0].TotalClaimAmount);

//   const stats = {
//     totalCustomers: globalData.length,
//     avgLifetimeValue: d3.mean(globalData, (d) => d.CustomerLifetimeValue),
//     avgPremium: d3.mean(globalData, (d) => d.MonthlyPremiumAuto),
//     totalClaims: d3.sum(globalData, (d) => d.TotalClaimAmount),
//   };

//   // Add debugging log for calculated stats
//   console.log("Calculated stats:", stats);

//   document.getElementById("summary-stats").innerHTML = `
//       <div style="display: flex; justify-content: center; gap: 40px; margin-top: 20px;">
//         <div>Total Customers: ${stats.totalCustomers.toLocaleString()}</div>
//         <div>Avg Lifetime Value: $${stats.avgLifetimeValue.toLocaleString(
//           undefined,
//           {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//           }
//         )}</div>
//         <div>Avg Monthly Premium: $${stats.avgPremium.toLocaleString(
//           undefined,
//           {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//           }
//         )}</div>
//         <div>Total Claims: $${stats.totalClaims.toLocaleString(undefined, {
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2,
//         })}</div>
//       </div>
//     `;
// }

// Create a helper function to check data validity
function checkDataValidity() {
  if (!globalData || !globalData.length) return false;

  const sampleData = globalData[0];
  console.log("Data validation check:");
  console.log("Sample data point:", sampleData);

  // Check if numeric fields are actually numbers
  const numericFields = [
    "CustomerLifetimeValue",
    "Income",
    "MonthlyPremiumAuto",
    "TotalClaimAmount",
    "MonthsSinceLastClaim",
    "MonthsSincePolicyInception",
  ];

  const validationResults = numericFields.map((field) => {
    const isValid =
      !isNaN(sampleData[field]) && typeof sampleData[field] === "number";
    console.log(`${field} validation:`, isValid, sampleData[field]);
    return isValid;
  });

  return validationResults.every((result) => result);
}

// Enhanced Histogram with Zoom
function createHistogram() {
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Clear previous content
  d3.select("#histogram").html("");

  const svg = d3
    .select("#histogram")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(globalData, (d) => d.CustomerLifetimeValue)])
    .range([0, width]);

  const histogram = d3
    .histogram()
    .value((d) => d.CustomerLifetimeValue)
    .domain(x.domain())
    .thresholds(x.ticks(30));

  const bins = histogram(globalData);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.length)])
    .range([height, 0]);

  // Add brush
  const brush = d3
    .brushX()
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("end", brushended);

  function brushended(event) {
    if (!event.selection) return;
    const [x0, x1] = event.selection.map(x.invert);
    x.domain([x0, x1]);
    updateHistogram();
  }

  // Add X axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 35)
    .attr("fill", "currentColor")
    .text("Customer Lifetime Value ($)");

  // Add Y axis
  svg
    .append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .attr("fill", "currentColor")
    .text("Frequency");

  // Add bars
  svg
    .selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0) + 1)
    .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("y", (d) => y(d.length))
    .attr("height", (d) => y(0) - y(d.length))
    .attr("fill", "var(--secondary-color)")
    .attr("opacity", 0.7);

  // Add brush
  svg.append("g").attr("class", "brush").call(brush);

  // Add tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  svg
    .selectAll("rect")
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          `Range: $${Math.round(d.x0)} - $${Math.round(d.x1)}<br>Count: ${
            d.length
          }`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function (d) {
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

// Violin/Box Plot for Vehicle Class Analysis
function createVehicleClassPlot() {
  const plotType = document.getElementById("plotType").value;
  const margin = { top: 20, right: 30, bottom: 60, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Clear previous content
  d3.select("#vehicleClassPlot").html("");

  const svg = d3
    .select("#vehicleClassPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Group data by vehicle class
  const vehicleClasses = Array.from(
    new Set(globalData.map((d) => d.VehicleClass))
  );

  const x = d3
    .scaleBand()
    .domain(vehicleClasses)
    .range([0, width])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(globalData, (d) => d.MonthlyPremiumAuto)])
    .range([height, 0]);

  if (plotType === "violin") {
    // Create violin plot
    vehicleClasses.forEach((vehicleClass) => {
      const values = globalData
        .filter((d) => d.VehicleClass === vehicleClass)
        .map((d) => d.MonthlyPremiumAuto);

      const kde = kernelDensityEstimator(kernelEpanechnikov(7), y.ticks(50));
      const density = kde(values);
      const maxDensity = d3.max(density, (d) => d[1]);

      const xScale = d3
        .scaleLinear()
        .domain([-maxDensity, maxDensity])
        .range([0, x.bandwidth()]);

      const area = d3
        .area()
        .x0((d) => x(vehicleClass) + xScale(-d[1]))
        .x1((d) => x(vehicleClass) + xScale(d[1]))
        .y((d) => y(d[0]))
        .curve(d3.curveCatmullRom);

      svg.append("path").datum(density).attr("class", "violin").attr("d", area);
    });
  } else {
    // Create box plot
    vehicleClasses.forEach((vehicleClass) => {
      const values = globalData
        .filter((d) => d.VehicleClass === vehicleClass)
        // Continuing the JavaScript code for box plots...

        .map((d) => d.MonthlyPremiumAuto)
        .sort(d3.ascending);

      const q1 = d3.quantile(values, 0.25);
      const median = d3.quantile(values, 0.5);
      const q3 = d3.quantile(values, 0.75);
      const iqr = q3 - q1;
      const whiskerLow = d3.min(values.filter((d) => d >= q1 - 1.5 * iqr));
      const whiskerHigh = d3.max(values.filter((d) => d <= q3 + 1.5 * iqr));
      const outliers = values.filter((d) => d < whiskerLow || d > whiskerHigh);

      // Draw box
      svg
        .append("rect")
        .attr("class", "box-plot")
        .attr("x", x(vehicleClass) + x.bandwidth() * 0.25)
        .attr("y", y(q3))
        .attr("width", x.bandwidth() * 0.5)
        .attr("height", y(q1) - y(q3))
        .attr("fill", "none");

      // Draw median line
      svg
        .append("line")
        .attr("class", "box-plot")
        .attr("x1", x(vehicleClass) + x.bandwidth() * 0.25)
        .attr("x2", x(vehicleClass) + x.bandwidth() * 0.75)
        .attr("y1", y(median))
        .attr("y2", y(median));

      // Draw whiskers
      svg
        .append("line")
        .attr("class", "box-plot")
        .attr("x1", x(vehicleClass) + x.bandwidth() * 0.5)
        .attr("x2", x(vehicleClass) + x.bandwidth() * 0.5)
        .attr("y1", y(whiskerLow))
        .attr("y2", y(q1));

      svg
        .append("line")
        .attr("class", "box-plot")
        .attr("x1", x(vehicleClass) + x.bandwidth() * 0.5)
        .attr("x2", x(vehicleClass) + x.bandwidth() * 0.5)
        .attr("y1", y(whiskerHigh))
        .attr("y2", y(q3));

      // Draw outliers
      svg
        .selectAll("circle")
        .data(outliers)
        .join("circle")
        .attr("class", "outlier")
        .attr("cx", x(vehicleClass) + x.bandwidth() * 0.5)
        .attr("cy", (d) => y(d))
        .attr("r", 3);
    });
  }

  // Add axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("g").call(d3.axisLeft(y));

  // Add labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .text("Vehicle Class");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("Monthly Premium ($)");
}

// Enhanced Scatter Plot with Regression Line
function createScatterPlot() {
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Clear previous content
  d3.select("#scatterPlot").html("");
  d3.select("#correlationValue").html("");

  const svg = d3
    .select("#scatterPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(globalData, (d) => d.Income)])
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(globalData, (d) => d.MonthlyPremiumAuto)])
    .range([height, 0]);

  // Add dots
  const dots = svg
    .selectAll("circle")
    .data(globalData)
    .join("circle")
    .attr("cx", (d) => x(d.Income))
    .attr("cy", (d) => y(d.MonthlyPremiumAuto))
    .attr("r", 4)
    .style("fill", "var(--secondary-color)")
    .style("opacity", 0.6);

  // Add regression line if enabled
  if (showRegression) {
    const regression = d3
      .regressionLinear()
      .x((d) => d.Income)
      .y((d) => d.MonthlyPremiumAuto);

    const regressionLine = regression(globalData);

    svg
      .append("line")
      .attr("class", "regression-line")
      .attr("x1", x(regressionLine[0][0]))
      .attr("y1", y(regressionLine[0][1]))
      .attr("x2", x(regressionLine[1][0]))
      .attr("y2", y(regressionLine[1][1]));

    // Calculate and display correlation coefficient
    const correlation = calculateCorrelation(
      globalData.map((d) => d.Income),
      globalData.map((d) => d.MonthlyPremiumAuto)
    );
    d3.select("#correlationValue").html(
      `Correlation Coefficient: ${correlation.toFixed(3)}`
    );
  }

  // Add axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 35)
    .attr("fill", "currentColor")
    .text("Income ($)");

  svg
    .append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .attr("fill", "currentColor")
    .text("Monthly Premium ($)");

  // Add tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  dots
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          `Income: $${d.Income.toLocaleString()}<br>Premium: $${d.MonthlyPremiumAuto.toFixed(
            2
          )}`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function (d) {
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

// Time Series Analysis Plot
function createTimeSeriesPlot() {
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Clear previous content
  d3.select("#timeSeriesPlot").html("");

  const svg = d3
    .select("#timeSeriesPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const metric = document.getElementById("timeMetric").value;

  // Group and aggregate data by month
  const timeData = d3.rollup(
    globalData,
    (v) => d3.mean(v, (d) => d[metric]),
    (d) => d3.timeMonth(d.EffectiveToDate)
  );

  const timeArray = Array.from(timeData, ([date, value]) => ({
    date,
    value,
  })).sort((a, b) => a.date - b.date);

  const x = d3
    .scaleTime()
    .domain(d3.extent(timeArray, (d) => d.date))
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(timeArray, (d) => d.value)])
    .range([height, 0]);

  // Add line
  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  svg
    .append("path")
    .datum(timeArray)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "var(--secondary-color)")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Add dots
  svg
    .selectAll("circle")
    .data(timeArray)
    .join("circle")
    .attr("cx", (d) => x(d.date))
    .attr("cy", (d) => y(d.value))
    .attr("r", 4)
    .attr("fill", "var(--primary-color)");

  // Add axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g").call(d3.axisLeft(y));

  // Add labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .text("Date");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text(
      metric === "TotalClaimAmount"
        ? "Total Claim Amount ($)"
        : "Monthly Premium ($)"
    );
}

// Utility Functions
function kernelDensityEstimator(kernel, X) {
  return function (V) {
    return X.map((x) => [x, d3.mean(V, (v) => kernel(x - v))]);
  };
}

function kernelEpanechnikov(k) {
  return function (v) {
    return Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
  };
}

function calculateCorrelation(x, y) {
  const n = x.length;
  const meanX = d3.mean(x);
  const meanY = d3.mean(y);
  const covariance =
    d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY))) / (n - 1);
  const stdX = Math.sqrt(d3.sum(x.map((xi) => (xi - meanX) ** 2)) / (n - 1));
  const stdY = Math.sqrt(d3.sum(y.map((yi) => (yi - meanY) ** 2)) / (n - 1));
  return covariance / (stdX * stdY);
}

// Event Handlers
function updateHistogram() {
  createHistogram();
}

function updateVehicleClassPlot() {
  createVehicleClassPlot();
}

function toggleRegressionLine() {
  showRegression = !showRegression;
  createScatterPlot();
}

function updateTimeSeriesPlot() {
  createTimeSeriesPlot();
}

// Global variables for data and chart states
// let globalData = [];
// let showRegression = false;

// Helper function to safely parse numeric values
function safeParseFloat(value) {
  if (!value) return 0;
  // First try direct conversion
  const parsed = parseFloat(value);
  if (!isNaN(parsed)) return parsed;
  // If that fails, try removing non-numeric characters (except . and -)
  const cleaned = value.toString().replace(/[^0-9.-]+/g, "");
  return parseFloat(cleaned) || 0;
}

// Helper function to safely parse integer values
function safeParseInt(value) {
  if (!value) return 0;
  return parseInt(value) || 0;
}

// Load data from CSV file
async function loadData() {
  try {
    const response = await fetch("./AutoInsurance.csv");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    const rawData = d3.csvParse(csvText);

    if (!rawData || !rawData.length) {
      throw new Error("No data found in CSV file");
    }

    // Log the raw data structure
    console.log("Raw data sample:", rawData[0]);

    // Convert string values to numbers with safe parsing
    const data = rawData.map((d) => ({
      CustomerLifetimeValue: safeParseFloat(d.CustomerLifetimeValue),
      Income: safeParseFloat(d.Income),
      MonthlyPremiumAuto: safeParseFloat(d.MonthlyPremiumAuto),
      TotalClaimAmount: safeParseFloat(d.TotalClaimAmount),
      MonthsSinceLastClaim: safeParseInt(d.MonthsSinceLastClaim),
      MonthsSincePolicyInception: safeParseInt(d.MonthsSincePolicyInception),
      EffectiveToDate: d.EffectiveToDate
        ? new Date(d.EffectiveToDate)
        : new Date(),
      // Preserve string fields
      VehicleClass: d.VehicleClass || "",
      Coverage: d.Coverage || "",
      EmploymentStatus: d.EmploymentStatus || "",
      MaritalStatus: d.MaritalStatus || "",
      Gender: d.Gender || "",
      Education: d.Education || "",
      Location: d.Location || "",
    }));

    // Log converted data sample
    console.log("Converted data sample:", data[0]);

    globalData = data;
    const loadingElement = document.querySelector(".loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
    createDashboard();
  } catch (error) {
    console.error("Error loading data:", error);
    const loadingElement = document.querySelector(".loading");
    if (loadingElement) {
      loadingElement.innerHTML =
        "Error loading data. Please check if the CSV file exists and is accessible.";
    }
    globalData = [];
  }
}

function updateSummaryStats() {
  if (!globalData || !globalData.length) {
    document.getElementById("summary-stats").innerHTML = `
            <div style="display: flex; justify-content: center; gap: 40px; margin-top: 20px;">
                <div>No data available</div>
            </div>
        `;
    return;
  }

  // Calculate stats
  const stats = {
    totalCustomers: globalData.length,
    avgLifetimeValue: d3.mean(globalData, (d) => d.CustomerLifetimeValue) || 0,
    avgPremium: d3.mean(globalData, (d) => d.MonthlyPremiumAuto) || 0,
    totalClaims: d3.sum(globalData, (d) => d.TotalClaimAmount) || 0,
  };

  // Format the stats display
  document.getElementById("summary-stats").innerHTML = `
        <div style="display: flex; justify-content: center; gap: 40px; margin-top: 20px;">
            <div>Total Customers: ${stats.totalCustomers.toLocaleString()}</div>
            <div>Avg Lifetime Value: $${stats.avgLifetimeValue.toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}</div>
            <div>Avg Monthly Premium: $${stats.avgPremium.toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}</div>
            <div>Total Claims: $${stats.totalClaims.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</div>
        </div>
    `;
}

function createDashboard() {
  try {
    updateSummaryStats();
    if (globalData && globalData.length > 0) {
      createHistogram();
      createVehicleClassPlot();
      createScatterPlot();
      createTimeSeriesPlot();
    }
  } catch (error) {
    console.error("Error creating dashboard:", error);
    document.getElementById("summary-stats").innerHTML = `
            <div style="color: red; text-align: center; margin-top: 20px;">
                Error creating dashboard: ${error.message}
            </div>
        `;
  }
}

// Rest of the code remains the same...

// Initialize dashboard
console.log("Init");
loadData();
