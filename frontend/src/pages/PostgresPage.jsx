import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Input, message, Upload, Tag, Typography, Row, Col, Statistic, Modal } from 'antd'
import { UploadOutlined, SearchOutlined, DatabaseOutlined, TableOutlined } from '@ant-design/icons'
import axios from 'axios'
import DataTable from '../components/DataTable'
import ChartRenderer from '../components/ChartRenderer'

const { Title, Text } = Typography
const { Search } = Input

const PostgresPage = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  // Fetch files from PostgreSQL
  const fetchPostgresFiles = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/postgres/files/')
      if (response.data.success) {
        setFiles(response.data.files)
      }
    } catch (error) {
      message.error('Failed to fetch files from PostgreSQL')
    }
    setLoading(false)
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/postgres/stats/')
      if (response.data.success) {
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats')
    }
  }

  // Upload to PostgreSQL
  const handleUpload = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await axios.post('/api/postgres/upload/', formData)
      if (response.data.success) {
        message.success('File saved to PostgreSQL!')
        fetchPostgresFiles()
        fetchStats()
      }
    } catch (error) {
      message.error('Upload failed')
    }
    
    setUploading(false)
    return false
  }

  // Search in PostgreSQL
  const handleSearch = async (value) => {
    if (!value.trim()) {
      fetchPostgresFiles()
      return
    }
    
    setLoading(true)
    try {
      const response = await axios.get(`/api/postgres/search/?q=${value}`)
      if (response.data.success) {
        setFiles(response.data.files)
      }
    } catch (error) {
      message.error('Search failed')
    }
    setLoading(false)
  }

  // Handle preview
  const handlePreview = (file) => {
    setSelectedFile(file)
    setPreviewVisible(true)
  }

  useEffect(() => {
    fetchPostgresFiles()
    fetchStats()
  }, [])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
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
      render: (cols) => cols?.length || 0,
    },
    {
      title: 'Rows',
      dataIndex: 'row_count',
      key: 'row_count',
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploaded_at',
      key: 'uploaded_at',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => handlePreview(record)}>
          Preview & Visualize
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>
        <DatabaseOutlined /> PostgreSQL Database
      </Title>
      
      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Files"
              value={stats?.total_files || 0}
              prefix={<TableOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="CSV Files"
              value={stats?.by_type?.CSV || 0}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              onClick={fetchPostgresFiles}
            >
              Refresh Files
            </Button>
          </Card>
        </Col>
      </Row>
      
      {/* Upload Section */}
      <Card style={{ marginBottom: 20, textAlign: 'center' }}>
        <DatabaseOutlined style={{ fontSize: 48, color: '#3366ff', marginBottom: 16 }} />
        <Title level={4}>Upload Files to PostgreSQL</Title>
        <Text type="secondary">Files are stored in SQL database (tables and rows)</Text>
        
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
              Upload to PostgreSQL
            </Button>
          </Upload>
        </div>
      </Card>
      
      {/* Search Section */}
      <Card style={{ marginBottom: 20 }}>
        <Search
          placeholder="Search files in PostgreSQL..."
          enterButton={<Button icon={<SearchOutlined />}>Search</Button>}
          size="large"
          onSearch={handleSearch}
        />
      </Card>
      
      {/* Files Table */}
      <Card title={`Files in PostgreSQL (${files.length})`}>
        <Table
          columns={columns}
          dataSource={files}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Preview & Visualization Modal */}
      <Modal
        title={selectedFile ? `Preview: ${selectedFile.filename}` : 'Preview'}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width="90%"
        footer={null}
      >
        {selectedFile && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <Statistic title="File Type" value={selectedFile.file_type} />
              </Col>
              <Col span={6}>
                <Statistic title="Rows" value={selectedFile.row_count} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Columns"
                  value={selectedFile.columns ? selectedFile.columns.length : 0}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Uploaded"
                  value={selectedFile.uploaded_at ? new Date(selectedFile.uploaded_at).toLocaleString() : ''}
                />
              </Col>
            </Row>

            {selectedFile.preview_data && selectedFile.preview_data.length > 0 ? (
              <>
                <DataTable
                  data={selectedFile.preview_data}
                  columns={selectedFile.columns?.map((col) => ({
                    title: col,
                    dataIndex: col,
                    key: col,
                  }))}
                  title={`Preview: ${selectedFile.filename}`}
                  fileType={selectedFile.file_type}
                  rowCount={selectedFile.row_count}
                />

                <ChartRenderer
                  data={selectedFile.preview_data}
                  columns={selectedFile.columns || []}
                />
              </>
            ) : (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <Text type="warning">
                  No preview data available for this file. Please re-upload the file to see visualization.
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PostgresPage
