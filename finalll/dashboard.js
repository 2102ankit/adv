// Fetch and parse CSV data
async function fetchData() {
  const response = await fetch(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/states_all-88Kdit2liPsXCXOrfifMQHBdrrz3G9.csv"
  );
  const text = await response.text();
  return Papa.parse(text, { header: true, dynamicTyping: true }).data;
}

// Helper function to get unique values from an array
function getUniqueValues(arr) {
  return [...new Set(arr)];
}

// Helper function to calculate average
function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Main function to create visualizations
async function createVisualizations() {
  const data = await fetchData();

  // 1. Enrollment Trends Over Time
  const states = getUniqueValues(data.map((d) => d.STATE));
  const years = getUniqueValues(data.map((d) => d.YEAR));
  const enrollmentData = states.map((state) => {
    return {
      x: years,
      y: years.map((year) => {
        const entry = data.find((d) => d.STATE === state && d.YEAR === year);
        return entry ? parseFloat(entry.ENROLL) : null;
      }),
      name: state,
      type: "scatter",
      mode: "lines+markers",
    };
  });

  Plotly.newPlot("enrollmentTrends", enrollmentData, {
    title: "Enrollment Trends Over Time",
    xaxis: { title: "Year" },
    yaxis: { title: "Enrollment" },
  });

  // 2. Revenue Sources Distribution
  const avgRevenue = {
    federal: average(data.map((d) => parseFloat(d.FEDERAL_REVENUE) || 0)),
    state: average(data.map((d) => parseFloat(d.STATE_REVENUE) || 0)),
    local: average(data.map((d) => parseFloat(d.LOCAL_REVENUE) || 0)),
  };

  Plotly.newPlot(
    "revenueSources",
    [
      {
        values: Object.values(avgRevenue),
        labels: Object.keys(avgRevenue),
        type: "pie",
      },
    ],
    {
      title: "Average Revenue Sources Distribution",
    }
  );

  // 3. Expenditure Categories
  const expenditureData = states.map((state) => {
    const stateData = data.filter((d) => d.STATE === state);
    return {
      x: ["Instruction", "Support Services", "Other", "Capital Outlay"],
      y: [
        average(
          stateData.map((d) => parseFloat(d.INSTRUCTION_EXPENDITURE) || 0)
        ),
        average(
          stateData.map((d) => parseFloat(d.SUPPORT_SERVICES_EXPENDITURE) || 0)
        ),
        average(stateData.map((d) => parseFloat(d.OTHER_EXPENDITURE) || 0)),
        average(
          stateData.map((d) => parseFloat(d.CAPITAL_OUTLAY_EXPENDITURE) || 0)
        ),
      ],
      name: state,
      type: "bar",
    };
  });

  Plotly.newPlot("expenditureCategories", expenditureData, {
    title: "Expenditure Categories by State",
    barmode: "stack",
    xaxis: { title: "Expenditure Category" },
    yaxis: { title: "Amount" },
  });

  // 4. Math and Reading Scores Comparison
  const scoreData = data
    .map((d) => ({
      x: parseFloat(d.AVG_MATH_4_SCORE) || 0,
      y: parseFloat(d.AVG_READING_4_SCORE) || 0,
      text: `${d.STATE} (${d.YEAR})`,
      mode: "markers",
      type: "scatter",
      name: "4th Grade",
    }))
    .concat(
      data.map((d) => ({
        x: parseFloat(d.AVG_MATH_8_SCORE) || 0,
        y: parseFloat(d.AVG_READING_8_SCORE) || 0,
        text: `${d.STATE} (${d.YEAR})`,
        mode: "markers",
        type: "scatter",
        name: "8th Grade",
      }))
    );

  Plotly.newPlot("scoreComparison", scoreData, {
    title: "Math vs Reading Scores",
    xaxis: { title: "Math Score" },
    yaxis: { title: "Reading Score" },
  });

  // 5. Enrollment Distribution by Grade
  const gradeData = [
    { x: data.map((d) => parseFloat(d.GRADES_PK_G) || 0), name: "Pre-K" },
    {
      x: data.map((d) => parseFloat(d.GRADES_KG_G) || 0),
      name: "Kindergarten",
    },
    { x: data.map((d) => parseFloat(d.GRADES_4_G) || 0), name: "4th Grade" },
    { x: data.map((d) => parseFloat(d.GRADES_8_G) || 0), name: "8th Grade" },
    { x: data.map((d) => parseFloat(d.GRADES_12_G) || 0), name: "12th Grade" },
  ];

  Plotly.newPlot(
    "gradeDistribution",
    gradeData.map((d) => ({
      x: d.x,
      type: "histogram",
      name: d.name,
    })),
    {
      title: "Enrollment Distribution by Grade",
      xaxis: { title: "Number of Students" },
      yaxis: { title: "Frequency" },
      barmode: "overlay",
    }
  );

  // 6. Per-Student Expenditure vs. Test Scores
  const bubbleData = data.map((d) => ({
    x: parseFloat(d.TOTAL_EXPENDITURE) / parseFloat(d.ENROLL) || 0,
    y:
      (parseFloat(d.AVG_MATH_4_SCORE) + parseFloat(d.AVG_READING_4_SCORE)) /
        2 || 0,
    text: `${d.STATE} (${d.YEAR})`,
    mode: "markers",
    marker: {
      size: parseFloat(d.ENROLL) / 1000,
      sizemode: "area",
      sizeref:
        (2 * Math.max(...data.map((d) => parseFloat(d.ENROLL) / 1000))) /
        40 ** 2,
      sizemin: 4,
    },
  }));

  Plotly.newPlot("expenditureVsScores", [bubbleData], {
    title: "Per-Student Expenditure vs. Average Test Scores",
    xaxis: { title: "Per-Student Expenditure" },
    yaxis: { title: "Average Test Score" },
  });

  // 7. State Revenue vs. Local Revenue
  const boxData = [
    {
      y: data.map((d) => parseFloat(d.STATE_REVENUE) || 0),
      name: "State Revenue",
    },
    {
      y: data.map((d) => parseFloat(d.LOCAL_REVENUE) || 0),
      name: "Local Revenue",
    },
  ];

  Plotly.newPlot(
    "revenueComparison",
    boxData.map((d) => ({
      y: d.y,
      type: "box",
      name: d.name,
    })),
    {
      title: "State Revenue vs. Local Revenue Distribution",
      yaxis: { title: "Revenue" },
    }
  );

  // 8. Enrollment vs. Total Revenue
  const enrollmentVsRevenueData = data.map((d) => ({
    x: parseFloat(d.ENROLL) || 0,
    y: parseFloat(d.TOTAL_REVENUE) || 0,
    text: `${d.STATE} (${d.YEAR})`,
    mode: "markers",
  }));

  Plotly.newPlot("enrollmentVsRevenue", [enrollmentVsRevenueData], {
    title: "Enrollment vs. Total Revenue",
    xaxis: { title: "Enrollment" },
    yaxis: { title: "Total Revenue" },
  }).then(() => {
    const xValues = enrollmentVsRevenueData.map((d) => d.x);
    const yValues = enrollmentVsRevenueData.map((d) => d.y);
    const result = regression.linear(xValues.map((x, i) => [x, yValues[i]]));
    const regressionLine = {
      x: [Math.min(...xValues), Math.max(...xValues)],
      y: result
        .predict(Math.min(...xValues))
        .concat(result.predict(Math.max(...xValues))),
      mode: "lines",
      line: { color: "red" },
      name: "Regression Line",
    };
    Plotly.addTraces("enrollmentVsRevenue", regressionLine);
  });

  // 9. Test Score Trends
  const scoresTrends = data.map((d) => ({
    x: parseFloat(d.AVG_MATH_4_SCORE) || 0,
    y: parseFloat(d.AVG_READING_4_SCORE) || 0,
    z: parseFloat(d.YEAR),
    text: `${d.STATE} (${d.YEAR})`,
    mode: "markers",
    type: "scatter3d",
    marker: { size: 5 },
  }));

  Plotly.newPlot("testScoreTrends", [scoresTrends], {
    title: "Test Score Trends (4th Grade)",
    scene: {
      xaxis: { title: "Math Score" },
      yaxis: { title: "Reading Score" },
      zaxis: { title: "Year" },
    },
  });

  // 10. State Performance Comparison
  const statePerformanceData = states.map((state) => {
    const stateData = data.filter((d) => d.STATE === state);
    return {
      y: stateData.map(
        (d) =>
          (parseFloat(d.AVG_MATH_4_SCORE) + parseFloat(d.AVG_READING_4_SCORE)) /
            2 || 0
      ),
      type: "violin",
      name: state,
    };
  });

  Plotly.newPlot("statePerformance", statePerformanceData, {
    title:
      "State Performance Comparison (Average of 4th Grade Math and Reading Scores)",
    yaxis: { title: "Average Score" },
  });
}

// Call the main function
createVisualizations();
