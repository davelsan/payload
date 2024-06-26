/* eslint-disable react/destructuring-assignment */
'use client'
import type { NumberField as NumberFieldType } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { isNumber } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import type { Option } from '../../elements/ReactSelect/types.js'
import type { FormFieldBase } from '../shared/index.js'

import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type NumberFieldProps = FormFieldBase & {
  hasMany?: boolean
  max?: number
  maxRows?: number
  min?: number
  name?: string
  onChange?: (e: number) => void
  path?: string
  placeholder?: NumberFieldType['admin']['placeholder']
  step?: number
  width?: string
}

const _NumberField: React.FC<NumberFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    descriptionProps,
    errorProps,
    hasMany = false,
    label,
    labelProps,
    max = Infinity,
    maxRows = Infinity,
    min = -Infinity,
    onChange: onChangeFromProps,
    path: pathFromProps,
    placeholder,
    readOnly: readOnlyFromProps,
    required,
    step = 1,
    style,
    validate,
    width,
  } = props

  const { i18n, t } = useTranslation()

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, max, min, required })
      }
    },
    [validate, min, max, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField<
    number | number[]
  >({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const handleChange = useCallback(
    (e) => {
      const val = parseFloat(e.target.value)
      let newVal = val

      if (Number.isNaN(val)) {
        newVal = undefined
      }

      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(newVal)
      }

      setValue(newVal)
    },
    [onChangeFromProps, setValue],
  )

  const [valueToRender, setValueToRender] = useState<
    { id: string; label: string; value: { value: number } }[]
  >([]) // Only for hasMany

  const handleHasManyChange = useCallback(
    (selectedOption) => {
      if (!disabled) {
        let newValue
        if (!selectedOption) {
          newValue = []
        } else if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => Number(option.value?.value || option.value))
        } else {
          newValue = [Number(selectedOption.value?.value || selectedOption.value)]
        }

        setValue(newValue)
      }
    },
    [disabled, setValue],
  )

  // useEffect update valueToRender:
  useEffect(() => {
    if (hasMany && Array.isArray(value)) {
      setValueToRender(
        value.map((val, index) => {
          return {
            id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
            label: `${val}`,
            value: {
              toString: () => `${val}${index}`,
              value: (val as unknown as Record<string, number>)?.value || val,
            }, // You're probably wondering, why the hell is this done that way? Well, React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
          }
        }),
      )
    }
  }, [value, hasMany])

  return (
    <div
      className={[
        fieldBaseClass,
        'number',
        className,
        showError && 'error',
        disabled && 'read-only',
        hasMany && 'has-many',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldLabel
        CustomLabel={CustomLabel}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />
        {hasMany ? (
          <ReactSelect
            className={`field-${path.replace(/\./g, '__')}`}
            disabled={disabled}
            filterOption={(_, rawInput) => {
              // eslint-disable-next-line no-restricted-globals
              const isOverHasMany = Array.isArray(value) && value.length >= maxRows
              return isNumber(rawInput) && !isOverHasMany
            }}
            isClearable
            isCreatable
            isMulti
            isSortable
            noOptionsMessage={() => {
              const isOverHasMany = Array.isArray(value) && value.length >= maxRows
              if (isOverHasMany) {
                return t('validation:limitReached', { max: maxRows, value: value.length + 1 })
              }
              return null
            }}
            // numberOnly
            onChange={handleHasManyChange}
            options={[]}
            placeholder={t('general:enterAValue')}
            showError={showError}
            value={valueToRender as Option[]}
          />
        ) : (
          <div>
            {BeforeInput}
            <input
              disabled={disabled}
              id={`field-${path.replace(/\./g, '__')}`}
              max={max}
              min={min}
              name={path}
              onChange={handleChange}
              onWheel={(e) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                e.target.blur()
              }}
              placeholder={getTranslation(placeholder, i18n)}
              step={step}
              type="number"
              value={typeof value === 'number' ? value : ''}
            />
            {AfterInput}
          </div>
        )}
        {CustomDescription !== undefined ? (
          CustomDescription
        ) : (
          <FieldDescription {...(descriptionProps || {})} />
        )}
      </div>
    </div>
  )
}

export const NumberField = withCondition(_NumberField)
