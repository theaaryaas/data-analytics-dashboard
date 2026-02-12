import React, { useState } from 'react'
import { Upload, Button, message, Card, Typography, Space, Alert } from 'antd'
import { UploadOutlined, FileExcelOutlined, FileTextOutlined, FileOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Title, Text } = Typography

const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false)

  const beforeUpload = (file) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json']
    const validExts = ['.csv', '.xlsx', '.xls', '.json']
    const isValid = validTypes.includes(file.type) || validExts.some(ext => file.name.endsWith(ext))
    if (!isValid) {
      message.error('You can only upload CSV, Excel, or JSON files!')
      return false
    }
    if (file.size / 1024 / 1024 >= 100) {
      message.error('File must be smaller than 100MB!')
      return false
    }
    return true
  }

  const handleUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        message.success(`${file.name} uploaded successfully!`)
        onSuccess(response.data, file)
        
        if (onUploadSuccess) {
          onUploadSuccess(response.data)
        }
      }
    } catch (error) {
      message.error(`Upload failed: ${error.response?.data?.detail || error.message}`)
      onError(error)
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (fileName) => {
    const icons = { '.csv': <FileTextOutlined style={{ color: '#52c41a' }} />, '.xlsx': <FileExcelOutlined style={{ color: '#1890ff' }} />, '.xls': <FileExcelOutlined style={{ color: '#1890ff' }} />, '.json': <FileOutlined style={{ color: '#fa8c16' }} /> }
    return icons[fileName.slice(fileName.lastIndexOf('.'))] || <UploadOutlined />
  }

  return (
    <Card 
      title="Upload Your Data Files" 
      style={{ marginBottom: '24px' }}
    >
      <Alert
        message="Supported Formats"
        description="CSV, Excel (.xlsx, .xls), JSON files up to 100MB"
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      <Upload
        customRequest={handleUpload}
        beforeUpload={beforeUpload}
        showUploadList={false}
        multiple={false}
      >
        <div className="file-upload-area">
          <UploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={4}>Click or drag file to upload</Title>
          <Text type="secondary">Support for CSV, Excel, JSON files</Text>
          <div style={{ marginTop: '20px' }}>
            <Button 
              type="primary" 
              size="large" 
              icon={<UploadOutlined />}
              loading={uploading}
            >
              {uploading ? 'Uploading...' : 'Select File'}
            </Button>
          </div>
        </div>
      </Upload>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Space size="large">
          <Card size="small" style={{ width: 150 }}>
            <FileExcelOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            <div style={{ marginTop: '8px' }}>Excel Files</div>
            <Text type="secondary">.xlsx, .xls</Text>
          </Card>
          
          <Card size="small" style={{ width: 150 }}>
            <FileTextOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
            <div style={{ marginTop: '8px' }}>CSV Files</div>
            <Text type="secondary">.csv</Text>
          </Card>
          
          <Card size="small" style={{ width: 150 }}>
            <FileOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />
            <div style={{ marginTop: '8px' }}>JSON Files</div>
            <Text type="secondary">.json</Text>
          </Card>
        </Space>
      </div>
    </Card>
  )
}

export default FileUpload