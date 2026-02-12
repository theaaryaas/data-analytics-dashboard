import React, { useState, useEffect } from 'react'
import { Card, Input, Button, Table, Tag, Typography, message, Upload, Row, Col, Statistic } from 'antd'
import { SearchOutlined, UploadOutlined, DatabaseOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Title, Text } = Typography
const { Search } = Input

const OpenSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState(null)

  // Fetch OpenSearch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/opensearch/stats/')
      if (response.data.success) {
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats')
    }
  }

  // Search in OpenSearch
  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const response = await axios.get(`/api/opensearch/search/?q=${encodeURIComponent(query)}`)
      if (response.data.success) {
        setSearchResults(response.data.results)
        if (response.data.results.length === 0) {
          message.info('No results found')
        }
      }
    } catch (error) {
      message.error('Search failed')
    }
    setLoading(false)
  }

  // Upload to OpenSearch
  const handleUpload = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await axios.post('/api/opensearch/upload/', formData)
      if (response.data.success) {
        message.success('File indexed in OpenSearch!')
        fetchStats() // Refresh stats
      }
    } catch (error) {
      message.error('Upload failed')
    }
    
    setUploading(false)
    return false
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const columns = [
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div>
            <Tag color="geekblue">Score: {record.score?.toFixed(2)}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type) => <Tag color={{ CSV: 'green', Excel: 'blue' }[type] || 'orange'}>{type}</Tag>,
    },
    {
      title: 'Columns',
      dataIndex: 'columns',
      key: 'columns',
      render: (cols) => (
        <div style={{ maxWidth: 200 }}>
          {cols?.slice(0, 3).map((col, i) => (
            <Tag key={i} color="blue" style={{ marginBottom: 2 }}>
              {col}
            </Tag>
          ))}
          {cols?.length > 3 && <Text type="secondary">+{cols.length - 3} more</Text>}
        </div>
      ),
    },
    {
      title: 'Content Preview',
      dataIndex: 'content',
      key: 'content',
      render: (content) => (
        <Text ellipsis style={{ maxWidth: 300 }}>
          {content?.substring(0, 100)}...
        </Text>
      ),
    },
  ]

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>
        <SearchOutlined /> OpenSearch
      </Title>
      
      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Indexed Files"
              value={stats?.indexed_files || 0}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Search Results"
              value={searchResults.length}
              prefix={<SearchOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              onClick={fetchStats}
            >
              Refresh Stats
            </Button>
          </Card>
        </Col>
      </Row>
      
      {/* Search Section */}
      <Card style={{ marginBottom: 20 }}>
        <Title level={4}>Search Your Files</Title>
        <Search
          placeholder="Search by filename, content, or columns..."
          enterButton={<Button type="primary" icon={<SearchOutlined />}>Search</Button>}
          size="large"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          loading={loading}
        />
        
        <div style={{ marginTop: 10 }}>
          <Text type="secondary">Try: sales, employee, csv, 2024</Text>
        </div>
      </Card>
      
      {/* Upload Section */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={4}>Index Files in OpenSearch</Title>
          <Text type="secondary">Make files searchable with full-text search</Text>
          
          <div style={{ marginTop: 20 }}>
            <Upload
              beforeUpload={handleUpload}
              showUploadList={false}
            >
              <Button 
                type="primary" 
                size="large"
                icon={<UploadOutlined />}
                loading={uploading}
              >
                Upload & Index
              </Button>
            </Upload>
          </div>
        </div>
      </Card>
      
      {/* Results Table */}
      <Card title={`Search Results (${searchResults.length})`}>
        <Table
          columns={columns}
          dataSource={searchResults}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default OpenSearchPage
