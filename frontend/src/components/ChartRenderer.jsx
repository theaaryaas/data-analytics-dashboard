import React from 'react'
import { Card, Empty, Select, Row, Col } from 'antd'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const { Option } = Select

const ChartRenderer = ({ data, columns }) => {
  const [chartType, setChartType] = React.useState('bar')
  const [xAxis, setXAxis] = React.useState('')
  const [yAxis, setYAxis] = React.useState('')

  const numericColumns = columns?.filter(col => {
    if (!data?.length) return false
    const samples = data.slice(0, 5).map(item => item[col]).filter(v => v != null)
    return samples.length > 0 && samples.every(val => typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(parseFloat(val))))
  }) || []

  React.useEffect(() => {
    if (numericColumns.length >= 2) {
      setXAxis(numericColumns[0])
      setYAxis(numericColumns[1])
    } else if (numericColumns.length === 1) {
      setXAxis(numericColumns[0])
      setYAxis(numericColumns[0])
    }
  }, [data, columns])

  const renderChart = () => {
    if (!data || data.length === 0 || !xAxis || !yAxis) {
      return <Empty description="No data available for chart" />
    }

    const chartData = data.slice(0, 20).map(item => ({
      name: (item[xAxis]?.toString() || '').substring(0, 20),
      value: typeof item[yAxis] === 'number' ? item[yAxis] : (parseFloat(item[yAxis]) || 0)
    }))

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#1890ff" />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#52c41a" />
          </LineChart>
        )
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )
      default:
        return <Empty description="Select chart type" />
    }
  }

  return (
    <Card 
      title="Data Visualization" 
      style={{ marginBottom: '24px' }}
      extra={
        <Row gutter={16}>
          <Col>
            <Select value={chartType} onChange={setChartType} style={{ width: 120 }}>
              <Option value="bar">Bar Chart</Option>
              <Option value="line">Line Chart</Option>
              <Option value="pie">Pie Chart</Option>
            </Select>
          </Col>
          <Col>
            <Select value={xAxis} onChange={setXAxis} style={{ width: 120 }} placeholder="X Axis">
              {numericColumns.map(col => (
                <Option key={col} value={col}>{col}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select value={yAxis} onChange={setYAxis} style={{ width: 120 }} placeholder="Y Axis">
              {numericColumns.map(col => (
                <Option key={col} value={col}>{col}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      }
    >
      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>
    </Card>
  )
}

export default ChartRenderer