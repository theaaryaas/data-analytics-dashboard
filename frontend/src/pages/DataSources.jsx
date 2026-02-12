import React, { useState, useEffect } from 'react'
import { 
  Table, Tag, Card, Typography, Button, Space, 
  Modal, message, Row, Col, Statistic, Empty, Spin 
} from 'antd'
import { 
  EyeOutlined, 
  FileExcelOutlined,
  FileTextOutlined,
  FileOutlined
} from '@ant-design/icons'
import axios from 'axios'
import FileUpload from '../components/FileUpload'
import DataTable from '../components/DataTable'

const { Title, Text } = Typography

const DataSources = ({ showUploader = false }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [fileToDelete, setFileToDelete] = useState(null)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files/')
      setFiles(response.data.files)
    } catch (error) {
      message.error('Failed to fetch files')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    fetchFiles()
    message.success('File uploaded successfully!')
  }

  const handlePreview = (file) => {
    setSelectedFile(file)
    setPreviewVisible(true)
  }

  const handleDelete = (file) => {
    setFileToDelete(file)
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    console.log('confirmDelete called!', { fileToDelete, deleteModalVisible })
    
    if (!fileToDelete || !fileToDelete.id) {
      console.error('No fileToDelete or fileToDelete.id')
      message.error('No file selected for deletion')
      setDeleteModalVisible(false)
      return
    }

    try {
      setLoading(true)
      console.log('Attempting to delete file:', fileToDelete.id, fileToDelete.filename)
      const response = await axios.delete(`/api/files/${fileToDelete.id}`)
      console.log('Delete response:', response)
      console.log('Delete response data:', response.data)
      
      if (response.data && response.data.success) {
        // Immediately remove from local state for better UX
        setFiles(prevFiles => prevFiles.filter(file => file.id !== fileToDelete.id))
        message.success(`Deleted ${fileToDelete.filename}`)
        setDeleteModalVisible(false)
        setFileToDelete(null)
        // Also refresh from server to ensure consistency
        await fetchFiles()
      } else {
        console.error('Unexpected response format:', response.data)
        message.error('Delete failed: Unexpected response format')
      }
    } catch (error) {
      console.error('Delete error details:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Unknown error'
      message.error('Delete failed: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getFileTypeIcon = (type) => {
    const icons = { Excel: <FileExcelOutlined style={{ color: '#1890ff' }} />, CSV: <FileTextOutlined style={{ color: '#52c41a' }} />, JSON: <FileOutlined style={{ color: '#fa8c16' }} /> }
    return icons[type] || null
  }

  const columns = [
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
      render: (text, record) => (
        <Space>
          {getFileTypeIcon(record.file_type)}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type) => <Tag color={{ Excel: 'blue', CSV: 'green' }[type] || 'orange'}>{type}</Tag>,
    },
    {
      title: 'Columns',
      dataIndex: 'columns',
      key: 'columns',
      render: (columns) => columns.length,
    },
    {
      title: 'Rows',
      dataIndex: 'row_count',
      key: 'row_count',
      render: (count) => <Tag color="geekblue">{count.toLocaleString()}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />} 
          size="small"
          onClick={() => handlePreview(record)}
        >
          Preview
        </Button>
      ),
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Title level={2}>Data Sources</Title>
      
      {showUploader && (
        <FileUpload onUploadSuccess={handleUploadSuccess} />
      )}

      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>Uploaded Files</Title>
            <Tag color="blue">{files.length} files</Tag>
          </Space>
        }
      >
        {files.length === 0 ? (
          <Empty 
            description="No files uploaded yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">Click the upload section above to upload your first file</Text>
          </Empty>
        ) : (
          <Table 
            columns={columns} 
            dataSource={files} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* File Preview Modal */}
      <Modal
        title={
          <Space>
            {selectedFile && getFileTypeIcon(selectedFile.file_type)}
            <span>Preview: {selectedFile?.filename}</span>
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width="90%"
        footer={null}
      >
        {selectedFile && (
          <div style={{ marginTop: '20px' }}>
            <Row gutter={16} style={{ marginBottom: '20px' }}>
              <Col span={6}>
                <Statistic title="File Type" value={selectedFile.file_type} />
              </Col>
              <Col span={6}>
                <Statistic title="Rows" value={selectedFile.row_count} />
              </Col>
              <Col span={6}>
                <Statistic title="Columns" value={selectedFile.columns.length} />
              </Col>
            </Row>
            
            <DataTable
              data={selectedFile.preview}
              columns={selectedFile.columns.map(col => ({
                title: col,
                dataIndex: col,
                key: col,
              }))}
              fileType={selectedFile.file_type}
              rowCount={selectedFile.row_count}
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false)
          setFileToDelete(null)
        }}
        okText="Delete"
        okType="danger"
        confirmLoading={loading}
        maskClosable={false}
      >
        <p>Are you sure you want to delete <strong>{fileToDelete?.filename}</strong>?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  )
}

export default DataSources