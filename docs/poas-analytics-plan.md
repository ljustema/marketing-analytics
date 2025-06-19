# POAS Analytics - Advanced Predictive Tab Implementation Plan

## Project Overview
Create an advanced analytics tab focused on POAS optimization with machine learning-based predictions to answer the key business question: **"Will we make more net profit in SEK if we lower POAS a bit?"**

## Business Goals
- Optimize POAS targets for maximum net profit (SEK)
- Provide data-driven marketing budget recommendations
- Enable scenario planning with confidence intervals
- Identify seasonal patterns and optimal POAS ranges

## Technical Architecture

### New Files Structure
```
/analytics/
├── poas-analytics.js          # Main analytics engine
├── poas-predictor.js          # ML prediction algorithms
├── poas-charts.js             # Specialized charts for analytics
├── poas-analytics.css         # Styling for analytics tab
└── poas-utils.js              # Utility functions
```

## Implementation Tasks

### Phase 1: Foundation & Data Analysis Engine
- [ ] **1.1** Create `analytics/poas-analytics.js` - Main analytics controller
- [ ] **1.2** Create `analytics/poas-utils.js` - Statistical analysis functions
  - [ ] Moving averages calculation
  - [ ] Trend detection algorithms
  - [ ] Correlation analysis (POAS vs Net Profit)
  - [ ] Seasonal pattern detection
- [ ] **1.3** Create `analytics/poas-predictor.js` - Prediction engine
  - [ ] Linear regression model for POAS optimization
  - [ ] Confidence interval calculations
  - [ ] Scenario modeling functions
  - [ ] Risk assessment algorithms

### Phase 2: User Interface & Tab Integration
- [ ] **2.1** Add new tab to `index.html`
  - [ ] "Predictive Analytics" tab button
  - [ ] Tab content container with sections
- [ ] **2.2** Create main analytics dashboard layout
  - [ ] POAS optimization slider section
  - [ ] Real-time prediction display
  - [ ] Historical performance comparison
  - [ ] Scenario results table
- [ ] **2.3** Create `analytics/poas-analytics.css` - Custom styling
  - [ ] Analytics-specific card designs
  - [ ] Slider styling and animations
  - [ ] Prediction result layouts

### Phase 3: Interactive POAS Optimizer
- [ ] **3.1** POAS Goal Slider Implementation
  - [ ] Range: 1.5 - 5.0 with 0.1 increments
  - [ ] Real-time value display
  - [ ] Current POAS indicator
  - [ ] Optimal range highlighting
- [ ] **3.2** Real-time Prediction Engine
  - [ ] Marketing spend calculation
  - [ ] Net profit projection (SEK)
  - [ ] Revenue impact estimation
  - [ ] ROI comparison vs current
- [ ] **3.3** Confidence Indicators
  - [ ] Prediction accuracy percentage
  - [ ] Risk level indicators (Low/Medium/High)
  - [ ] Historical performance match score

### Phase 4: Advanced Charts & Visualizations
- [ ] **4.1** Create `analytics/poas-charts.js` - Specialized charts
- [ ] **4.2** POAS Optimization Chart
  - [ ] X-axis: POAS values (1.5-5.0)
  - [ ] Y-axis: Predicted net profit (SEK)
  - [ ] Current position marker
  - [ ] Optimal zone highlighting
  - [ ] Confidence bands
- [ ] **4.3** Scenario Comparison Chart
  - [ ] Bar chart: Current vs Predicted scenarios
  - [ ] Multiple POAS targets comparison
  - [ ] Net profit impact visualization
- [ ] **4.4** Historical Pattern Analysis Chart
  - [ ] Seasonal POAS performance
  - [ ] Trend lines and patterns
  - [ ] Performance correlation scatter plot

### Phase 5: Smart Recommendations Engine
- [ ] **5.1** Algorithm Development
  - [ ] Historical performance analysis
  - [ ] Seasonal adjustment factors
  - [ ] Risk-adjusted recommendations
- [ ] **5.2** Recommendation Display
  - [ ] "Optimal POAS" suggestion with reasoning
  - [ ] "Quick wins" opportunities
  - [ ] "Risk warnings" for extreme changes
  - [ ] Monthly/seasonal recommendations
- [ ] **5.3** Action Planning
  - [ ] Marketing budget allocation suggestions
  - [ ] Timeline for POAS adjustments
  - [ ] Expected results timeline

### Phase 6: Advanced Features
- [ ] **6.1** Multi-Variable Optimization
  - [ ] POAS + Marketing spend optimization
  - [ ] Revenue vs Profit trade-off analysis
  - [ ] Market conditions consideration
- [ ] **6.2** Scenario Planning
  - [ ] "What-if" scenario builder
  - [ ] Multiple scenario comparison
  - [ ] Best/worst case analysis
- [ ] **6.3** Performance Tracking
  - [ ] Prediction accuracy tracking
  - [ ] Model performance metrics
  - [ ] Continuous learning integration

## Data Requirements

### Input Data (from existing app)

**Manual Input (3 datapoints per month):**
- `revenue` (Omsättning SEK) - Monthly revenue
- `grossprofit` (Bruttovinst SEK) - Monthly gross profit
- `marketingSpend` (Marknadsföring SEK) - Monthly marketing spend

**Auto-Calculated Metrics (7 datapoints):**
- `roas` = revenue ÷ marketingSpend (Return on Ad Spend)
- `poas` = grossprofit ÷ marketingSpend (Profit on Ad Spend)
- `grossMarginPercent` = (grossprofit ÷ revenue) × 100 (Bruttovinst %)
- `netProfitPercent` = ((grossprofit - marketingSpend) ÷ revenue) × 100 (Nettovinst %)
- `netProfit` = grossprofit - marketingSpend (Nettovinst SEK)
- `marketingPercent` = (marketingSpend ÷ revenue) × 100 (Marknadsföring %)
- `poasRoasRatio` = poas ÷ roas (POAS/ROAS Ratio)

**Additional Data:**
- `breakevenROAS` - Break-even point calculation
- Historical performance (23+ months of data)
- Current thresholds and targets

### Data Structure Example:
```json
{
  "month": "2023-07",
  "revenue": 676499,
  "grossprofit": 234499,
  "marketingSpend": 71677,
  "roas": 9.438160079244389,
  "poas": 3.271607349637959,
  "grossMarginPercent": 34.66361369344227,
  "marketingPercent": 10.59528543279443,
  "netProfit": 162822,
  "netProfitPercent": 24.068328260647835,
  "poasRoasRatio": 0.34663613693442263,
  "breakevenROAS": 2.8848694450722605
}
```

### Calculated Analytics Data
- Moving averages (3, 6, 12 months)
- Trend coefficients and seasonality factors
- Correlation matrices
- Prediction confidence scores
- Optimal POAS ranges per month/season

## Calculation Formulas & Prediction Methodology

### Core Business Logic
Since users input only 3 values monthly, our prediction engine must:
1. **Predict the 3 core inputs** for future scenarios:
   - `revenue` (Omsättning SEK)
   - `grossprofit` (Bruttovinst SEK)
   - `marketingSpend` (Marknadsföring SEK)

2. **Auto-calculate all derived metrics** using the same formulas as the main app:
   ```javascript
   roas = revenue / marketingSpend
   poas = grossprofit / marketingSpend
   grossMarginPercent = (grossprofit / revenue) * 100
   netProfitPercent = ((grossprofit - marketingSpend) / revenue) * 100
   netProfit = grossprofit - marketingSpend
   marketingPercent = (marketingSpend / revenue) * 100
   poasRoasRatio = poas / roas
   ```

### POAS Optimization Strategy
**Key Insight:** When user adjusts POAS target, we need to:
1. **Estimate required marketingSpend** to achieve target POAS
2. **Predict resulting revenue** based on historical ROAS patterns
3. **Calculate expected grossprofit** using historical gross margin trends
4. **Compute final netProfit** = grossprofit - marketingSpend

## Key Algorithms

### 1. POAS Optimization Algorithm
```javascript
// Predict net profit based on POAS target
function predictNetProfit(targetPOAS, historicalData, currentMonth) {
    // Step 1: Estimate required marketing spend for target POAS
    // Based on: targetPOAS = grossprofit / marketingSpend
    // So: marketingSpend = grossprofit / targetPOAS

    // Step 2: Predict revenue using historical ROAS patterns
    // Use seasonal factors and trend analysis

    // Step 3: Estimate grossprofit using historical gross margin %
    // grossprofit = revenue * avgGrossMarginPercent

    // Step 4: Calculate final metrics
    // netProfit = grossprofit - marketingSpend
    // roas = revenue / marketingSpend
    // etc.

    // Return: { netProfit, confidence, marketingSpend, revenue, grossprofit, allMetrics }
}
```

### 2. Seasonal Pattern Detection
```javascript
// Identify seasonal patterns in POAS performance
function detectSeasonalPatterns(monthlyData) {
    // Analyze month-over-month patterns in:
    // - revenue trends
    // - grossMarginPercent stability
    // - marketingSpend efficiency
    // - poas performance by season

    // Return: { seasonalFactors, optimalPOASByMonth, confidenceByMonth }
}
```

### 3. Marketing Spend Predictor
```javascript
// Calculate required marketing spend for target POAS
function calculateMarketingSpend(targetPOAS, predictedGrossProfit) {
    // Formula: marketingSpend = grossprofit / targetPOAS
    // Include confidence intervals based on historical variance

    // Return: { marketingSpend, minSpend, maxSpend, confidence }
}
```

### 4. Risk Assessment
```javascript
// Calculate risk level for POAS changes
function assessRisk(currentPOAS, targetPOAS, historicalData) {
    // Analyze:
    // - Historical netProfit variance at different POAS levels
    // - Revenue stability when changing marketing spend
    // - Gross margin consistency

    // Return: { riskLevel, confidenceInterval, recommendations, warnings }
}
```

## Success Metrics

### User Experience
- [ ] Slider responds in <100ms
- [ ] Predictions update in real-time
- [ ] Clear visual indicators for optimal ranges
- [ ] Intuitive recommendation explanations

### Prediction Accuracy
- [ ] >85% accuracy for 1-month predictions
- [ ] >75% accuracy for 3-month predictions
- [ ] Confidence intervals within ±10% of actual results

### Business Impact
- [ ] Clear answer to "lower POAS = more profit?" question
- [ ] Actionable POAS recommendations
- [ ] Quantified risk assessment for changes
- [ ] ROI projections for marketing spend adjustments

## Technical Considerations

### Performance
- All calculations must be client-side for real-time response
- Efficient algorithms for large datasets (23+ months)
- Caching of complex calculations

### Data Integration
- Seamless integration with existing data loading (`loadData()`)
- No modifications to existing data structure
- Backward compatibility with current analytics

### User Interface
- Consistent with existing dashboard design
- Mobile-responsive layout
- Accessibility considerations (ARIA labels, keyboard navigation)

## Next Steps
1. Start with Phase 1: Create foundation files and basic analytics engine
2. Implement core POAS optimization algorithm
3. Build interactive slider and real-time predictions
4. Add advanced visualizations and recommendations
5. Test with historical data for accuracy validation

## Notes
- Focus on answering the core business question first
- Build incrementally with working features at each phase
- Maintain existing app functionality throughout development
- Consider user feedback for UI/UX improvements
