import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, PiggyBank, BarChart3, Percent } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [funds, setFunds] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [monthlyAmount, setMonthlyAmount] = useState(5000);
  const [periodYears, setPeriodYears] = useState(10);
  const [inflationRate, setInflationRate] = useState(6);
  const [stepUpPercent, setStepUpPercent] = useState(10);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFunds();
  }, []);

  useEffect(() => {
    if (selectedFund) {
      calculateSIP();
    }
  }, [monthlyAmount, periodYears, inflationRate, stepUpPercent, selectedFund]);

  const fetchFunds = async () => {
    try {
      const response = await axios.get(`${API}/funds`);
      setFunds(response.data);
      if (response.data.length > 0) {
        setSelectedFund(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching funds:", error);
    }
  };

  const calculateSIP = async () => {
    if (!selectedFund) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/calculate-sip`, {
        monthly_amount: monthlyAmount,
        period_years: periodYears,
        expected_return: selectedFund.expected_return,
        inflation_rate: inflationRate,
        step_up_percent: stepUpPercent,
        fund_type: selectedFund.type
      });
      setCalculation(response.data);
    } catch (error) {
      console.error("Error calculating SIP:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="App">
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title" data-testid="main-heading">
              SIP Calculator
            </h1>
            <p className="hero-subtitle" data-testid="hero-subtitle">
              Plan your wealth journey with intelligent fund analysis
            </p>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="container">
          <div className="grid-layout">
            {/* Left Section - Fund Selection */}
            <div className="funds-section">
              <Card className="fund-card">
                <CardHeader>
                  <CardTitle className="card-title">Choose Your Fund</CardTitle>
                  <CardDescription>Select from different market cap categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={funds[0]?.type} className="w-full">
                    <TabsList className="grid grid-cols-2 gap-2 h-auto mb-4">
                      {funds.map((fund) => (
                        <TabsTrigger
                          key={fund.type}
                          value={fund.type}
                          onClick={() => setSelectedFund(fund)}
                          className="fund-tab"
                          data-testid={`fund-tab-${fund.type}`}
                        >
                          {fund.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {funds.map((fund) => (
                      <TabsContent key={fund.type} value={fund.type}>
                        <div className="fund-details">
                          <div className="fund-return">
                            <TrendingUp className="icon" />
                            <div>
                              <p className="label">Expected Return</p>
                              <p className="value">{fund.expected_return}% p.a.</p>
                            </div>
                          </div>
                          <div className="fund-risk">
                            <BarChart3 className="icon" />
                            <div>
                              <p className="label">Risk Level</p>
                              <p className="value">{fund.risk_level}</p>
                            </div>
                          </div>
                          <p className="fund-description">{fund.description}</p>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Input Controls */}
              <Card className="input-card">
                <CardHeader>
                  <CardTitle className="card-title">Investment Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="input-group">
                    <Label htmlFor="monthly-amount" className="input-label">
                      Monthly SIP Amount
                    </Label>
                    <div className="input-with-currency">
                      <span className="currency-symbol">₹</span>
                      <Input
                        id="monthly-amount"
                        type="number"
                        value={monthlyAmount}
                        onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                        className="currency-input"
                        data-testid="monthly-amount-input"
                      />
                    </div>
                    <Slider
                      value={[monthlyAmount]}
                      onValueChange={(value) => setMonthlyAmount(value[0])}
                      min={500}
                      max={100000}
                      step={500}
                      className="mt-2"
                      data-testid="monthly-amount-slider"
                    />
                  </div>

                  <div className="input-group">
                    <Label htmlFor="period" className="input-label">
                      Investment Period (Years)
                    </Label>
                    <Input
                      id="period"
                      type="number"
                      value={periodYears}
                      onChange={(e) => setPeriodYears(Number(e.target.value))}
                      className="styled-input"
                      data-testid="period-input"
                    />
                    <Slider
                      value={[periodYears]}
                      onValueChange={(value) => setPeriodYears(value[0])}
                      min={1}
                      max={40}
                      step={1}
                      className="mt-2"
                      data-testid="period-slider"
                    />
                  </div>

                  <div className="input-group">
                    <Label htmlFor="inflation" className="input-label">
                      Inflation Rate (%)
                    </Label>
                    <Input
                      id="inflation"
                      type="number"
                      value={inflationRate}
                      onChange={(e) => setInflationRate(Number(e.target.value))}
                      className="styled-input"
                      step="0.1"
                      data-testid="inflation-input"
                    />
                    <Slider
                      value={[inflationRate]}
                      onValueChange={(value) => setInflationRate(value[0])}
                      min={0}
                      max={15}
                      step={0.5}
                      className="mt-2"
                      data-testid="inflation-slider"
                    />
                  </div>

                  <div className="input-group">
                    <Label htmlFor="stepup" className="input-label">
                      Annual Step-up (%)
                    </Label>
                    <Input
                      id="stepup"
                      type="number"
                      value={stepUpPercent}
                      onChange={(e) => setStepUpPercent(Number(e.target.value))}
                      className="styled-input"
                      step="0.1"
                      data-testid="stepup-input"
                    />
                    <Slider
                      value={[stepUpPercent]}
                      onValueChange={(value) => setStepUpPercent(value[0])}
                      min={0}
                      max={30}
                      step={1}
                      className="mt-2"
                      data-testid="stepup-slider"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Section - Results */}
            <div className="results-section">
              {calculation && (
                <>
                  <Card className="result-card main-result">
                    <CardHeader>
                      <CardTitle className="card-title">Expected Maturity Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="maturity-value" data-testid="maturity-value">
                        {formatCurrency(calculation.maturity_value)}
                      </div>
                      <div className="result-grid">
                        <div className="result-item">
                          <PiggyBank className="result-icon invested" />
                          <div>
                            <p className="result-label">Total Invested</p>
                            <p className="result-amount" data-testid="total-invested">
                              {formatCurrency(calculation.total_invested)}
                            </p>
                          </div>
                        </div>
                        <div className="result-item">
                          <TrendingUp className="result-icon returns" />
                          <div>
                            <p className="result-label">Expected Returns</p>
                            <p className="result-amount" data-testid="expected-returns">
                              {formatCurrency(calculation.expected_returns)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="result-card inflation-card">
                    <CardHeader>
                      <CardTitle className="card-title">Inflation Adjusted Returns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="inflation-content">
                        <div className="inflation-icon-wrapper">
                          <Percent className="inflation-icon" />
                        </div>
                        <div className="inflation-details">
                          <div className="inflation-item">
                            <p className="result-label">Real Value (Today's Money)</p>
                            <p className="result-amount" data-testid="inflation-adjusted-value">
                              {formatCurrency(calculation.inflation_adjusted_value)}
                            </p>
                          </div>
                          <div className="inflation-item">
                            <p className="result-label">Real Returns</p>
                            <p className="result-amount" data-testid="real-returns">
                              {formatCurrency(calculation.real_returns)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="result-card">
                    <CardHeader>
                      <CardTitle className="card-title">Yearly Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="yearly-breakdown">
                        {calculation.yearly_breakdown.slice(-5).reverse().map((year) => (
                          <div key={year.year} className="year-item" data-testid={`year-${year.year}`}>
                            <div className="year-header">
                              <span className="year-number">Year {year.year}</span>
                              <span className="year-value">{formatCurrency(year.expected_value)}</span>
                            </div>
                            <div className="year-details">
                              <span className="detail-text">Invested: {formatCurrency(year.invested_amount)}</span>
                              <span className="detail-text">Real Value: {formatCurrency(year.real_value)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;