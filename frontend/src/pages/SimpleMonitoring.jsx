import React, { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Typography, Button } from 'antd'
import { UploadOutlined, AlertOutlined, ClockCircleOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Title, Text } = Typography

const SimpleMonitoring = () => {
  const [metrics, setMetrics] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/metrics')

      // Parse simple metrics from text
      const lines = response.data.split('\n')
      const parsed = {}

      lines.forEach((line) => {
        if (line && !line.startsWith('#')) {
          const parts = line.split(' ')
          if (parts.length >= 2) {
            parsed[parts[0]] = parts[1]
          }
        }
      })

      setMetrics(parsed)
    } catch (error) {
      console.error('Failed to fetch metrics', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  return (
    <div>
      <Title level={2}>📊 Simple Monitoring</Title>

      <Button
        type="primary"
        onClick={fetchMetrics}
        loading={loading}
        style={{ marginBottom: 20 }}
      >
        Refresh Metrics
      </Button>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Files Uploaded"
              value={metrics['file_uploads_total'] || 0}
              prefix={<UploadOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Total Errors"
              value={metrics['errors_total'] || 0}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Last Checked"
              value={new Date().toLocaleTimeString()}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Raw Metrics">
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: 15,
            borderRadius: 4,
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key}>
              <Text strong>{key}:</Text> {value}
            </div>
          ))}
        </pre>
      </Card>
    </div>
  )
}

export default SimpleMonitoring

