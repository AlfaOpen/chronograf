import React from 'react'
import {useMemo} from 'react'
import SubSections from 'src/shared/components/SubSections'
import {Source, SourceAuthenticationMethod} from 'src/types'
import {PageSection} from 'src/types/shared'
import {WrapToPage} from './AdminInfluxDBScopedPage'

interface Props {
  source: Source
  activeTab: 'databases' | 'users' | 'roles' | 'queries'
  children: JSX.Element | JSX.Element[]
  onTabChange?: (section: PageSection, url: string) => void
}
export function hasRoleManagement(source: Source) {
  return !!source?.links?.roles
}
export function isConnectedToLDAP(source: Source) {
  return source.authentication === SourceAuthenticationMethod.LDAP
}

export const AdminTabs = ({
  source,
  activeTab,
  children,
  onTabChange,
}: Props) => {
  const sections = useMemo(() => {
    const hasRoles = hasRoleManagement(source)
    const isLDAP = isConnectedToLDAP(source)
    return [
      {
        url: 'databases',
        name: 'Databases',
        enabled: true,
      },
      {
        url: 'users',
        name: 'Users',
        enabled: !isLDAP,
      },
      {
        url: 'roles',
        name: 'Roles',
        enabled: hasRoles && !isLDAP,
      },
      {
        url: 'queries',
        name: 'Queries',
        enabled: true,
      },
    ]
  }, [source])
  return (
    <SubSections
      parentUrl="admin-influxdb"
      sourceID={source.id}
      activeSection={activeTab}
      sections={sections}
      position="top"
      onTabChange={onTabChange}
    >
      {children}
    </SubSections>
  )
}
const AdminInfluxDBTabbedPage = ({
  source,
  activeTab,
  children,
  onTabChange,
}: Props) => {
  return (
    <WrapToPage hideRefresh={activeTab === 'queries'}>
      <AdminTabs
        source={source}
        activeTab={activeTab}
        onTabChange={onTabChange}
      >
        {children}
      </AdminTabs>
    </WrapToPage>
  )
}
export default AdminInfluxDBTabbedPage
