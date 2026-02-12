import React, { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Space } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  SearchOutlined,
  TableOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import Dashboard from './pages/Dashboard'
import DataSources from './pages/DataSources'
import SimpleMonitoring from './pages/SimpleMonitoring'
import MongoDBPage from './pages/MongoDBPage'
import OpenSearchPage from './pages/OpenSearchPage'
import PostgresPage from './pages/PostgresPage'
import './App.css'

const { Header, Sider, Content } = Layout
const { Title } = Typography

// Configure axios
axios.defaults.baseURL = 'http://localhost:8000'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [systemStats, setSystemStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      const response = await axios.get('/api/stats/')
      setSystemStats(response.data.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'data-sources',
      icon: <DatabaseOutlined />,
      label: 'Data Sources',
    },
    {
      key: 'monitoring',
      icon: <LineChartOutlined />,
      label: 'Monitoring',
    },
    {
      key: 'mongodb-docker',
      icon: <DatabaseOutlined />,
      label: 'MongoDB Docker',
    },
    {
      key: 'opensearch',
      icon: <SearchOutlined />,
      label: 'OpenSearch',
    },
    {
      key: 'postgresql',
      icon: <TableOutlined />,
      label: 'PostgreSQL',
    },
  ]

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard systemStats={systemStats} onNavigate={setCurrentPage} />
      case 'data-sources':
        return <DataSources showUploader={true} />
      case 'monitoring':
        return <SimpleMonitoring />
      case 'mongodb-docker':
        return <MongoDBPage />
      case 'opensearch':
        return <OpenSearchPage />
      case 'postgresql':
        return <PostgresPage />
      default:
        return <Dashboard systemStats={systemStats} onNavigate={setCurrentPage} />
    }
  }

  return (
    <Layout className="app-container">
      <Header style={{ background: '#001529', padding: '0 20px' }}>
        <Space align="center" style={{ height: '100%' }}>
          <DashboardOutlined style={{ fontSize: '24px', color: 'white' }} />
          <Title level={3} style={{ color: 'white', margin: 0, lineHeight: '64px' }}>
            Data Analytics Dashboard
          </Title>
          <span style={{ color: 'rgba(255,255,255,0.65)', marginLeft: '20px' }}>
            Upload and analyze CSV, Excel, JSON files
          </span>
        </Space>
      </Header>
      
      <Layout>
        <Sider width={250} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            onClick={({ key }) => setCurrentPage(key)}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        
        <Layout style={{ padding: '24px' }}>
          <Content className="site-layout-background">
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App