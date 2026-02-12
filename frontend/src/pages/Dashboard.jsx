import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Empty, Spin, Alert } from 'antd'
import { 
  FileDoneOutlined, 
  DatabaseOutlined, 
  BarChartOutlined, 
  CloudUploadOutlined,
  TagOutlined
} from '@ant-design/icons'
import axios from 'axios'
import DataTable from '../components/DataTable'
import ChartRenderer from '../components/ChartRenderer'

const { Title } = Typography

const Dashboard = ({ systemStats, onNavigate }) => {
  const [recentFiles, setRecentFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    fetchRecentFiles()
  }, [])

  const fetchRecentFiles = async () => {
    try {
      // Fetch from SQLite, PostgreSQL, and MongoDB
      const [sqliteResponse, postgresResponse, mongoResponse] = await Promise.allSettled([
        axios.get('/api/files/'),
        axios.get('/api/postgres/files/'),
        axios.get('/api/mongodb/files/')
      ])

      let allFiles = []

      // Add SQLite files (includes files uploaded via MongoDB too)
      if (sqliteResponse.status === 'fulfilled' && sqliteResponse.value.data.files) {
        const sqliteFiles = sqliteResponse.value.data.files.map(file => ({
          ...file,
          source: 'SQLite',
          preview: file.preview || (file.data_preview ? JSON.parse(file.data_preview) : [])
        }))
        allFiles = [...allFiles, ...sqliteFiles]
      }

      if (postgresResponse.status === 'fulfilled' && postgresResponse.value.data.success) {
        allFiles = [...allFiles, ...postgresResponse.value.data.files.map(file => ({
          ...file, source: 'PostgreSQL', preview: file.preview_data || [],
          id: `pg_${file.id}`, uploaded_at: file.uploaded_at || new Date().toISOString()
        }))]
      }

      if (mongoResponse.status === 'fulfilled' && mongoResponse.value.data.success) {
        const sqliteFilenames = new Set(allFiles.filter(f => f.source === 'SQLite').map(f => f.filename))
        const mongoFiles = mongoResponse.value.data.files.map(file => ({
          ...file, source: 'MongoDB', preview: file.preview_data || [],
          id: `mongo_${file._id}`, uploaded_at: file.uploaded_at || new Date().toISOString()
        })).filter(f => !sqliteFilenames.has(f.filename))
        allFiles = [...allFiles, ...mongoFiles]
      }

      const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0)
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) return date
        const match = dateStr.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/)
        return match ? new Date(`${match[1]}T${match[2]}`) : new Date(0)
      }
      allFiles.sort((a, b) => parseDate(b.uploaded_at).getTime() - parseDate(a.uploaded_at).getTime())

      setRecentFiles(allFiles.slice(0, 5))
      
      // Auto-select first file for preview
      if (recent.length > 0 && !selectedFile) {
        setSelectedFile(recent[0])
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Title level={2}>Dashboard Overview</Title>
      
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Files"
              value={systemStats?.total_files || 0}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Rows"
              value={systemStats?.total_rows || 0}
              prefix={<FileDoneOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Columns"
              value={systemStats?.total_columns || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="File Types"
              value={Object.keys(systemStats?.file_types || {}).length}
              prefix={<CloudUploadOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Files */}
      <Card 
        title="Recent Files" 
        style={{ marginBottom: '24px' }}
        extra={onNavigate ? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('data-sources'); }}>View All</a> : <a href="#data-sources">View All</a>}
      >
        {recentFiles.length === 0 ? (
          <Empty description="No files uploaded yet" />
        ) : (
          <Row gutter={16}>
            {recentFiles.map(file => (
              <Col span={8} key={file.id}>
                <Card 
                  size="small" 
                  hoverable
                  onClick={() => setSelectedFile(file)}
                  style={{ 
                    border: selectedFile?.id === file.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                    cursor: 'pointer'
                  }}
                >
                  <Title level={5} ellipsis>{file.filename}</Title>
                  <p>Type: {file.file_type}</p>
                  <p>Rows: {file.row_count}</p>
                  <p>Columns: {file.columns?.length || 0}</p>
                  {file.source && (
                    <p style={{ marginTop: 8 }}>
                      <TagOutlined style={{ marginRight: 4 }} />
                      <span style={{ 
                        color: file.source === 'PostgreSQL' ? '#3366ff' : 
                               file.source === 'MongoDB' ? '#13c2c2' : '#52c41a',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {file.source}
                      </span>
                    </p>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Selected File Preview */}
      {selectedFile && (
        <>
          <Card 
            title={`Preview: ${selectedFile.filename} ${selectedFile.source ? `(${selectedFile.source})` : ''}`}
            style={{ marginBottom: '24px' }}
          >
            {selectedFile.preview && selectedFile.preview.length > 0 ? (
              <>
                <DataTable
                  data={selectedFile.preview}
                  columns={(selectedFile.columns || []).map(col => ({
                    title: col,
                    dataIndex: col,
                    key: col,
                  }))}
                  title={`Preview: ${selectedFile.filename}`}
                  fileType={selectedFile.file_type}
                  rowCount={selectedFile.row_count}
                />

                {/* Chart Visualization */}
                <ChartRenderer
                  data={selectedFile.preview}
                  columns={selectedFile.columns || []}
                />
              </>
            ) : (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>No preview data available for this file.</p>
                <p style={{ color: '#999', fontSize: '12px' }}>
                  {selectedFile.source === 'PostgreSQL' 
                    ? 'Re-upload the file to PostgreSQL to see visualization.'
                    : 'This file does not have preview data.'}
                </p>
              </div>
            )}
          </Card>
        </>
      )}

      {!selectedFile && recentFiles.length > 0 && (
        <Alert
          message="Select a file to preview data and create charts"
          type="info"
          showIcon
        />
      )}
    </div>
  )
}

export default Dashboard