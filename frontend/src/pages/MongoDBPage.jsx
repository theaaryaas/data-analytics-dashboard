import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Input, message, Upload, Tag, Typography, Modal, Row, Col, Statistic } from 'antd'
import { UploadOutlined, SearchOutlined, DatabaseOutlined } from '@ant-design/icons'
import axios from 'axios'
import DataTable from '../components/DataTable'
import ChartRenderer from '../components/ChartRenderer'

const { Title, Text } = Typography
const { Search } = Input

const MongoDBPage = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const fetchMongoFiles = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/mongodb/files/')
      if (response.data.success) {
        setFiles(response.data.files)
      }
    } catch (error) {
      message.error('Failed to fetch files from MongoDB')
    }
    setLoading(false)
  }
  const handlePreview = (file) => {
    setSelectedFile(file)
    setPreviewVisible(true)
  }

  const handleUpload = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await axios.post('/api/mongodb/upload/', formData)
      if (response.data.success) {
        message.success('File saved to MongoDB Docker!')
        fetchMongoFiles()
      } else {
        message.error(response.data.error || 'Upload failed')
      }
    } catch (error) {
      message.error('Upload failed')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleSearch = async (value) => {
    if (!value.trim()) {
      fetchMongoFiles()
      return
    }

    setLoading(true)
    try {
      const response = await axios.get(`/api/mongodb/search/?q=${value}`)
      if (response.data.success) {
        setFiles(response.data.files)
      }
    } catch (error) {
      message.error('Search failed')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMongoFiles()
  }, [])

  const columns = [
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
      render: (cols) => (cols ? cols.length : 0),
    },
    {
      title: 'Rows',
      dataIndex: 'row_count',
      key: 'row_count',
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
        <DatabaseOutlined /> MongoDB in Docker
      </Title>

      <Card style={{ marginBottom: 20, textAlign: 'center' }}>
        <DatabaseOutlined style={{ fontSize: 48, color: '#13c2c2', marginBottom: 16 }} />
        <Title level={4}>Upload Files to MongoDB Docker</Title>
        <Text type="secondary">
          Files are stored in MongoDB running inside a Docker container.
        </Text>

        <div style={{ marginTop: 20 }}>
          <Upload beforeUpload={handleUpload} showUploadList={false}>
            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              loading={uploading}
            >
              Upload to MongoDB Docker
            </Button>
          </Upload>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <Search
          placeholder="Search files in MongoDB..."
          enterButton={<Button icon={<SearchOutlined />}>Search</Button>}
          size="large"
          onSearch={handleSearch}
        />
        <Button onClick={fetchMongoFiles} style={{ marginTop: 10 }}>
          Refresh List
        </Button>
      </Card>

      <Card title={`Files in MongoDB Docker (${files.length})`}>
        <Table
          columns={columns}
          dataSource={files}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

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

export default MongoDBPage

