'use client'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { Props } from './types'

import Banner from '../../../elements/Banner'
import { Button } from '../../../elements/Button'
import DraggableSortable from '../../../elements/DraggableSortable'
import DraggableSortableItem from '../../../elements/DraggableSortable/DraggableSortableItem'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useConfig } from '../../../providers/Config'
import { useDocumentInfo } from '../../../providers/DocumentInfo'
import { useLocale } from '../../../providers/Locale'
import { useTranslation } from '../../../providers/Translation'
import { scrollToID } from '../../../utilities/scrollToID'
import { useForm, useFormSubmitted } from '../../Form/context'
import LabelComp from '../../Label'
import { NullifyLocaleField } from '../../NullifyField'
import useField from '../../useField'
import { fieldBaseClass } from '../shared'
import { ArrayRow } from './ArrayRow'
import './index.scss'

const baseClass = 'array-field'

const ArrayFieldType: React.FC<Props> = (props) => {
  const {
    name,
    Description,
    Error,
    Label: LabelFromProps,
    className,
    fieldMap,
    forceRender = false,
    indexPath,
    label,
    localized,
    path: pathFromProps,
    permissions,
    readOnly,
    required,
    validate,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const minRows = 'minRows' in props ? props.minRows : 0
  const maxRows = 'maxRows' in props ? props.maxRows : undefined

  const { setDocFieldPreferences } = useDocumentInfo()
  const { dispatchFields, setModified } = useForm()
  const submitted = useFormSubmitted()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()
  const { localization } = useConfig()

  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale || 'en'
      return locale === defaultLocale
    }

    return true
  })()

  // Handle labeling for Arrays, Global Arrays, and Blocks
  const getLabels = (p: Props) => {
    if ('labels' in p && p?.labels) return p.labels
    if ('label' in p && p?.label) return { plural: undefined, singular: p.label }
    return { plural: t('general:rows'), singular: t('general:row') }
  }

  const labels = getLabels(props)

  const memoizedValidate = useCallback(
    (value, options) => {
      // alternative locales can be null
      if (!editingDefaultLocale && value === null) {
        return true
      }
      if (typeof validate === 'function') {
        return validate(value, { ...options, maxRows, minRows, required })
      }
    },
    [maxRows, minRows, required, validate, editingDefaultLocale],
  )

  const {
    path,
    rows = [],
    showError,
    valid,
    value,
  } = useField<number>({
    hasRows: true,
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const addRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({
        path,
        rowIndex,
        type: 'ADD_ROW',
      })

      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex + 1}`)
      }, 0)
    },
    [dispatchFields, path, setModified],
  )

  const duplicateRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({ path, rowIndex, type: 'DUPLICATE_ROW' })
      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex}`)
      }, 0)
    },
    [dispatchFields, path, setModified],
  )

  const removeRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({ path, rowIndex, type: 'REMOVE_ROW' })
      setModified(true)
    },
    [dispatchFields, path, setModified],
  )

  const moveRow = useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      dispatchFields({ moveFromIndex, moveToIndex, path, type: 'MOVE_ROW' })
      setModified(true)
    },
    [dispatchFields, path, setModified],
  )

  const toggleCollapseAll = useCallback(
    (collapsed: boolean) => {
      dispatchFields({ collapsed, path, setDocFieldPreferences, type: 'SET_ALL_ROWS_COLLAPSED' })
    },
    [dispatchFields, path, setDocFieldPreferences],
  )

  const setCollapse = useCallback(
    (rowID: string, collapsed: boolean) => {
      dispatchFields({ collapsed, path, rowID, setDocFieldPreferences, type: 'SET_ROW_COLLAPSED' })
    },
    [dispatchFields, path, setDocFieldPreferences],
  )

  const hasMaxRows = maxRows && rows.length >= maxRows

  const fieldErrorCount =
    rows.reduce((total, row) => total + (row?.errorPaths?.size || 0), 0) + (valid ? 0 : 1)

  const fieldHasErrors = submitted && fieldErrorCount > 0

  const showRequired = readOnly && rows.length === 0
  const showMinRows = rows.length < minRows || (required && rows.length === 0)

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
    >
      {showError && <div className={`${baseClass}__error-wrap`}>{Error}</div>}
      <header className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-wrap`}>
          <div className={`${baseClass}__header-content`}>
            <h3 className={`${baseClass}__title`}>{Label}</h3>
            {fieldHasErrors && fieldErrorCount > 0 && (
              <ErrorPill count={fieldErrorCount} i18n={i18n} withMessage />
            )}
          </div>
          {rows.length > 0 && (
            <ul className={`${baseClass}__header-actions`}>
              <li>
                <button
                  className={`${baseClass}__header-action`}
                  onClick={() => toggleCollapseAll(true)}
                  type="button"
                >
                  {t('fields:collapseAll')}
                </button>
              </li>
              <li>
                <button
                  className={`${baseClass}__header-action`}
                  onClick={() => toggleCollapseAll(false)}
                  type="button"
                >
                  {t('fields:showAll')}
                </button>
              </li>
            </ul>
          )}
        </div>
        {Description}
      </header>
      <NullifyLocaleField fieldValue={value} localized={localized} path={path} />
      {(rows.length > 0 || (!valid && (showRequired || showMinRows))) && (
        <DraggableSortable
          className={`${baseClass}__draggable-rows`}
          ids={rows.map((row) => row.id)}
          onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
        >
          {rows.map((row, i) => (
            <DraggableSortableItem disabled={readOnly} id={row.id} key={row.id}>
              {(draggableSortableItemProps) => (
                <ArrayRow
                  {...draggableSortableItemProps}
                  addRow={addRow}
                  duplicateRow={duplicateRow}
                  // CustomRowLabel={CustomRowLabel}
                  fieldMap={fieldMap}
                  forceRender={forceRender}
                  hasMaxRows={hasMaxRows}
                  indexPath={indexPath}
                  labels={labels}
                  moveRow={moveRow}
                  path={path}
                  permissions={permissions}
                  readOnly={readOnly}
                  removeRow={removeRow}
                  row={row}
                  rowCount={rows.length}
                  rowIndex={i}
                  setCollapse={setCollapse}
                />
              )}
            </DraggableSortableItem>
          ))}
          {!valid && (
            <React.Fragment>
              {showRequired && (
                <Banner>
                  {t('validation:fieldHasNo', { label: getTranslation(labels.plural, i18n) })}
                </Banner>
              )}
              {showMinRows && (
                <Banner type="error">
                  {t('validation:requiresAtLeast', {
                    count: minRows,
                    label:
                      getTranslation(minRows ? labels.plural : labels.singular, i18n) ||
                      t(minRows > 1 ? 'general:row' : 'general:rows'),
                  })}
                </Banner>
              )}
            </React.Fragment>
          )}
        </DraggableSortable>
      )}
      {!readOnly && !hasMaxRows && (
        <Button
          buttonStyle="icon-label"
          className={`${baseClass}__add-row`}
          icon="plus"
          iconPosition="left"
          iconStyle="with-border"
          onClick={() => addRow(value || 0)}
        >
          {t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
        </Button>
      )}
    </div>
  )
}

export default ArrayFieldType