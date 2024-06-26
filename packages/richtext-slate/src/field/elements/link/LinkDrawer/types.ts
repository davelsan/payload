import type { FieldMap } from '@payloadcms/ui'
import type { FormState } from 'payload'

export type Props = {
  drawerSlug: string
  fieldMap: FieldMap
  handleClose: () => void
  handleModalSubmit: (fields: FormState, data: Record<string, unknown>) => void
  initialState?: FormState
}
