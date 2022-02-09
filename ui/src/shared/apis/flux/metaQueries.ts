import _ from 'lodash'

import AJAX from 'src/utils/ajax'
import {Source, SchemaFilter} from 'src/types'
import recordProperty from 'src/flux/helpers/recordProperty'
import fluxString from 'src/flux/helpers/fluxString'
import parseValuesColumn from 'src/shared/parsing/flux/values'

export const fetchMeasurements = async (
  source: Source,
  bucket: string
): Promise<string[]> => {
  const csvResponse = await tagValues({
    bucket,
    source,
    tagKey: '_measurement',
    limit: 0,
  })
  return parseValuesColumn(csvResponse)
}

export const fields = async (
  source: Source,
  bucket: string,
  filter: SchemaFilter[],
  limit: number
): Promise<string> => {
  return await tagValues({
    bucket,
    source,
    tagKey: '_field',
    limit,
    filter,
  })
}

// Fetch all the fields and their associated measurement
export const fieldsByMeasurement = async (
  source: Source,
  bucket: string
): Promise<string> => {
  const script = `
  from(bucket:${fluxString(bucket)})
    |> range(start: -30d)
    |> group(columns: ["_field", "_measurement"], mode: "by")
    |> distinct(column: "_field")
    |> group()
    |> map(fn: (r) => ({_measurement: r._measurement, _field: r._field}))
  `
  return proxy(source, script)
}

export const tagKeys = async (
  source: Source,
  bucket: string,
  filter: SchemaFilter[]
): Promise<string> => {
  let tagKeyFilter = ''

  if (filter.length) {
    const predicates = filter.map(({key}) => `r._value != ${fluxString(key)}`)
    tagKeyFilter = `\n   |> filter(fn: (r) => (${predicates.join(' and ')}) )`
  }

  const script = `
from(bucket:${fluxString(bucket)}) 
  |> range(start: -30d) 
  |> keys()
  |> keep(columns: ["_value"])
  |> distinct()${tagKeyFilter}`

  return proxy(source, script)
}

interface TagValuesParams {
  source: Source
  bucket: string
  tagKey: string
  limit: number
  filter?: SchemaFilter[]
  searchTerm?: string
  count?: boolean
}

export const tagValues = async ({
  bucket,
  source,
  tagKey,
  limit,
  searchTerm = '',
  count = false,
}: TagValuesParams): Promise<string> => {
  let regexFilter = ''
  if (searchTerm) {
    regexFilter = `\n  |> filter(fn: (r) => ${recordProperty(
      tagKey
    )} =~ /${searchTerm}/)`
  }

  const limitFunc = count || !limit ? '' : `\n  |> limit(n:${limit})`
  const countFunc = count ? '\n  |> count()' : ''

  const script = `
from(bucket: "${bucket}")
  |> range(start: -30d)
  |> keep(columns: [${fluxString(tagKey)}])
  |> group()
  |> distinct(column: ${fluxString(
    tagKey
  )})${regexFilter}${limitFunc}${countFunc}
  `

  return proxy(source, script)
}

export const tagsFromMeasurement = async (
  source: Source,
  bucket: string,
  measurement: string
): Promise<string> => {
  const script = `
    from(bucket:${fluxString(bucket)}}) 
      |> range(start:-30d) 
      |> filter(fn:(r) => r._measurement == ${fluxString(measurement)}") 
      |> group() 
      |> keys()
      |> keep(columns: ["_value"])
  `

  return proxy(source, script)
}

export const proxy = async (source: Source, script: string) => {
  const mark = encodeURIComponent('?')
  const minimizedScript = script.replace(/\s/g, '') // server cannot handle whitespace
  const dialect = {annotations: ['group', 'datatype', 'default']}
  const data = {query: minimizedScript, dialect}
  const base = source.links.flux

  try {
    const response = await AJAX({
      method: 'POST',
      url: `${base}?version=${source.version}&path=/api/v2/query${mark}organization=defaultorgname`,
      data,
      headers: {'Content-Type': 'application/json'},
    })

    return response.data
  } catch (error) {
    handleError(error)
  }
}

const handleError = error => {
  console.error('Problem fetching data', error)

  throw (
    _.get(error, 'headers.x-influx-error', false) ||
    _.get(error, 'data.message', 'unknown error 🤷')
  )
}
