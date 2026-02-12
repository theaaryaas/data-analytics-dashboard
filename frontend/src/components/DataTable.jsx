import React from 'react'
import { Table, Tag, Space, Card, Typography } from 'antd'
import { FileExcelOutlined, FileTextOutlined, FileOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const DataTable = ({ data, columns, title, fileType, rowCount }) => {
  
  const getFileTypeTag = (type) => {
    const typeConfig = {
      'CSV': { color: 'green', icon: <FileTextOutlined /> },
      'Excel': { color: 'blue', icon: <FileExcelOutlined /> },
      'JSON': { color: 'orange', icon: <FileOutlined /> }
    }
    
    const config = typeConfig[type] || { color: 'default', icon: null }
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {type}
      </Tag>
    )
  }

  // Create table columns from data if not provided
  const tableColumns = columns || (data.length > 0 ? 
    Object.keys(data[0]).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true,
    })) : []
  )

  return (
    <Card 
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>{title || 'Data Preview'}</Title>
          {fileType && getFileTypeTag(fileType)}
          {rowCount && (
            <Tag color="geekblue">{rowCount} rows</Tag>
          )}
        </Space>
      }
      style={{ marginBottom: '24px' }}
    >
      <Table
        columns={tableColumns}
        dataSource={data.map((item, index) => ({ ...item, key: index }))}
        pagination={{ 
          pageSize: 10, 
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} rows`
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </Card>
  )
}

export default DataTable