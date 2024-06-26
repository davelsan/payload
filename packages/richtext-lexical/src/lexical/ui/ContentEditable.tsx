import type { JSX } from 'react'

import { ContentEditable } from '@lexical/react/LexicalContentEditable.js'
import * as React from 'react'

import './ContentEditable.scss'

export function LexicalContentEditable({ className }: { className?: string }): JSX.Element {
  return <ContentEditable className={className ?? 'ContentEditable__root'} />
}
