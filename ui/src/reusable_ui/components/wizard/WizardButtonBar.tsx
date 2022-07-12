// Libraries
import React, {PureComponent} from 'react'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  decrement?: () => void
  nextLabel?: string
  previousLabel?: string
  lastStep?: boolean
  onClickPrevious: () => void
  onClickNext: () => void
  testId?: {previousLabel: string; nextLabel: string}
}

@ErrorHandling
class WizardButtonBar extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    nextLabel: 'Next',
    previousLabel: 'Previous',
  }

  public render() {
    const {
      decrement,
      previousLabel,
      nextLabel,
      onClickPrevious,
      onClickNext,
      testId = {
        previousLabel: 'previous--button',
        nextLabel: 'next--button',
      },
    } = this.props
    return (
      <div className="wizard-button-bar">
        {decrement && (
          <button
            className="btn btn-md btn-default"
            onClick={onClickPrevious}
            data-test={testId.previousLabel}
          >
            {previousLabel}
          </button>
        )}
        <button
          className={`btn btn-md ${this.buttonColor}`}
          onClick={onClickNext}
          data-test={testId.nextLabel}
        >
          {nextLabel}
        </button>
      </div>
    )
  }

  private get buttonColor() {
    const {lastStep} = this.props

    if (lastStep) {
      return 'btn-success'
    }

    return 'btn-primary'
  }
}

export default WizardButtonBar
