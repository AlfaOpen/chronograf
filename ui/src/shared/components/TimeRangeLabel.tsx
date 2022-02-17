import moment from 'moment'
import {connect} from 'react-redux'

import {timeRanges} from 'src/shared/data/timeRanges'
import {TimeRange, TimeZones} from 'src/types'
import _ from 'lodash'

const dateFormat = 'YYYY-MM-DD HH:mm'
const format = (t: string, timeZone: string) => {
  const m = moment(t.replace(/'/g, ''))
  if (timeZone === TimeZones.UTC) {
    m.utc()
  }
  return m.format(dateFormat)
}

interface PassedProps {
  timeRange: TimeRange
}
type Props = PassedProps & ReturnType<typeof mstp>

const TimeRangeLabel = ({timeRange: {upper, lower}, timeZone}: Props) => {
  if (upper && lower) {
    if (upper === 'now()') {
      return `${format(lower, timeZone)} - Now`
    }

    return `${format(lower, timeZone)} - ${format(upper, timeZone)}`
  }
  const selected = timeRanges.find(range => range.lower === lower)
  return selected ? selected.inputValue : 'Custom'
}

const mstp = (state: any) => ({
  timeZone: _.get(state, ['app', 'persisted', 'timeZone']) as TimeZones,
})
export default connect(mstp)(TimeRangeLabel)